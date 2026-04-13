export type { AuthenticatedAccount, AuthContext, AuthResult } from './types/auth.js';
export { authenticate, injectAccountContext, AuthenticationError } from './services/auth.js';