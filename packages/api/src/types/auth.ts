import type { APIGatewayProxyEvent } from 'aws-lambda';

/**
 * Authenticated account context
 */
export interface AuthenticatedAccount {
  accountId: string;
  isAdmin: boolean;
}

/**
 * Auth context injected into Lambda event
 * This extends the standard API Gateway event with authenticated account info
 */
export interface AuthContext extends APIGatewayProxyEvent {
  accountContext: AuthenticatedAccount;
}

/**
 * Auth result returned by the auth service
 */
export interface AuthResult {
  account: AuthenticatedAccount;
  isAdmin: boolean;
}