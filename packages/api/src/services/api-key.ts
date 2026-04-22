import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ApiKey } from '@second-brain/interfaces';

const dynamodbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

const API_KEYS_TABLE_NAME = process.env.API_KEYS_TABLE_NAME || 'SecondBrain-ApiKeys';

/**
 * Hashes an API secret using SHA-256.
 * @param secret - The plain text secret to hash
 * @returns The SHA-256 hash as a hex string
 */
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a new API key for an account.
 * @param accountId - The ID of the account to generate the key for
 * @returns The created API key with the plain text secret (shown only once)
 */
export async function generateApiKey(accountId: string): Promise<ApiKey & { secret: string }> {
  // Generate a secure random secret
  const secret = crypto.randomUUID();

  // Hash the secret for storage
  const keyHash = await hashSecret(secret);

  const keyId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newApiKey: ApiKey = {
    keyId,
    accountId,
    keyHash,
    status: 'active',
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: API_KEYS_TABLE_NAME,
      Item: newApiKey,
    })
  );

  // Return the key with the plain text secret (only available at creation)
  return { ...newApiKey, secret };
}

/**
 * Validates an API key by checking if the secret matches the stored hash.
 * @param apiKeyId - The ID of the API key to validate
 * @param secret - The plain text secret to verify
 * @returns The API key if valid and active, null otherwise
 */
export async function validateApiKey(
  apiKeyId: string,
  secret: string
): Promise<ApiKey | null> {
  // Fetch the API key by ID
  const result = await docClient.send(
    new GetCommand({
      TableName: API_KEYS_TABLE_NAME,
      Key: { keyId: apiKeyId },
    })
  );

  const apiKey = result.Item as ApiKey | undefined;

  // If not found, return null
  if (!apiKey) {
    return null;
  }

  // If revoked, return null
  if (apiKey.status === 'revoked') {
    return null;
  }

  // Hash the provided secret and compare
  const providedHash = await hashSecret(secret);

  if (providedHash !== apiKey.keyHash) {
    return null;
  }

  return apiKey;
}

/**
 * Revokes an API key.
 * @param apiKeyId - The ID of the API key to revoke
 */
export async function revokeApiKey(apiKeyId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: API_KEYS_TABLE_NAME,
      Key: { keyId: apiKeyId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'revoked',
      },
    })
  );
}