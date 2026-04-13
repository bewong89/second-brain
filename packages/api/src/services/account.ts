import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Account } from '@second-brain/interfaces';

const dynamodbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

const ACCOUNTS_TABLE_NAME = process.env.ACCOUNTS_TABLE_NAME || 'SecondBrain-Accounts';

/**
 * Creates a new account in DynamoDB.
 * @param account - The account object to create (without accountId, createdAt, updatedAt)
 * @returns The created account with all fields populated
 */
export async function createAccount(
  account: Omit<Account, 'accountId' | 'createdAt' | 'updatedAt'>
): Promise<Account> {
  const now = new Date().toISOString();
  const accountId = crypto.randomUUID();
  
  const newAccount: Account = {
    accountId,
    name: account.name,
    email: account.email,
    status: account.status ?? 'active',
    isAdmin: account.isAdmin ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: ACCOUNTS_TABLE_NAME,
      Item: newAccount,
    })
  );

  return newAccount;
}

/**
 * Retrieves an account by its ID from DynamoDB.
 * @param accountId - The ID of the account to retrieve
 * @returns The account if found, null otherwise
 */
export async function getAccount(accountId: string): Promise<Account | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: ACCOUNTS_TABLE_NAME,
      Key: { accountId },
    })
  );

  return (result.Item as Account) ?? null;
}
