export interface Account {
  accountId: string;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  keyId: string;
  accountId: string;
  keyHash: string;
  status: 'active' | 'revoked';
  createdAt: string;
}