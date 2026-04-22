import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { createHash } from 'crypto';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import type { AuthResult, AuthenticatedAccount, AuthContext } from '../types/auth.js';

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE || 'SecondBrain-Accounts';
const API_KEYS_TABLE = process.env.API_KEYS_TABLE || 'SecondBrain-ApiKeys';

interface ApiKeyRecord {
  keyId: string;
  accountId: string;
  keyHash: string;
  status: string;
}

interface AccountRecord {
  accountId: string;
  name: string;
  email: string;
  status: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1] ?? null;
}

async function getApiKeyRecord(keyId: string): Promise<ApiKeyRecord | null> {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  const params: GetCommandInput = {
    TableName: API_KEYS_TABLE,
    Key: { keyId },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item as ApiKeyRecord | null;
}

async function getAccountRecord(accountId: string): Promise<AccountRecord | null> {
  const client = new DynamoDBClient({});
  const docClient = DynamoDBDocumentClient.from(client);

  const params: GetCommandInput = {
    TableName: ACCOUNTS_TABLE,
    Key: { accountId },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item as AccountRecord | null;
}

export async function authenticate(
  event: APIGatewayProxyEvent
): Promise<AuthResult> {
  const token = extractBearerToken(event.headers.Authorization ?? event.headers.authorization);

  if (!token) {
    throw new AuthenticationError('Missing authorization header');
  }

  const [keyId, rawKey] = token.split(':');
  if (!keyId || !rawKey) {
    throw new AuthenticationError('Invalid token format');
  }

  const apiKeyRecord = await getApiKeyRecord(keyId);
  if (!apiKeyRecord) {
    throw new AuthenticationError('Invalid API key');
  }

  if (apiKeyRecord.status !== 'active') {
    throw new AuthenticationError('API key is not active');
  }

  const keyHash = sha256(rawKey);
  if (keyHash !== apiKeyRecord.keyHash) {
    throw new AuthenticationError('Invalid API key');
  }

  const accountRecord = await getAccountRecord(apiKeyRecord.accountId);
  if (!accountRecord) {
    throw new AuthenticationError('Account not found');
  }

  if (accountRecord.status !== 'active') {
    throw new AuthenticationError('Account is not active');
  }

  return {
    account: {
      accountId: accountRecord.accountId,
      isAdmin: accountRecord.isAdmin,
    },
    isAdmin: accountRecord.isAdmin,
  };
}

export function injectAccountContext(
  event: APIGatewayProxyEvent,
  account: AuthenticatedAccount
): AuthContext {
  return {
    ...event,
    accountContext: account,
  } as AuthContext;
}

export class AuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}