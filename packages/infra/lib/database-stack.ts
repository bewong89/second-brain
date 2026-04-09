import { RemovalPolicy, Stack, StackProps, aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * DatabaseStack - DynamoDB database infrastructure for Second Brain
 *
 * Creates:
 * - Accounts table (PK: accountId)
 * - ApiKeys table (PK: keyId, GSI on accountId)
 */
export class DatabaseStack extends Stack {
  /** DynamoDB table for account information */
  public readonly accountsTable: dynamodb.Table;

  /** DynamoDB table for API keys */
  public readonly apiKeysTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const removalPolicy = this.getRemovalPolicy();

    // Accounts table - PK is accountId
    this.accountsTable = new dynamodb.Table(this, 'AccountsTable', {
      tableName: 'SecondBrain-Accounts',
      partitionKey: {
        name: 'accountId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
      timeToLiveAttribute: undefined, // Can be added for TTL if needed
    });

    // Enable deletion protection for prod environments
    if (removalPolicy === RemovalPolicy.RETAIN) {
      this.accountsTable.applyRemovalPolicy(RemovalPolicy.RETAIN);
    }

    // ApiKeys table - PK is keyId, GSI on accountId for querying keys by account
    this.apiKeysTable = new dynamodb.Table(this, 'ApiKeysTable', {
      tableName: 'SecondBrain-ApiKeys',
      partitionKey: {
        name: 'keyId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy,
    });

    // Add GSI on accountId for querying keys by account
    this.apiKeysTable.addGlobalSecondaryIndex({
      indexName: 'AccountIdIndex',
      partitionKey: {
        name: 'accountId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Enable deletion protection for prod environments
    if (removalPolicy === RemovalPolicy.RETAIN) {
      this.apiKeysTable.applyRemovalPolicy(RemovalPolicy.RETAIN);
    }
  }

  /**
   * Gets the removal policy based on stage.
   * Returns DESTROY for dev, RETAIN for production stages.
   */
  private getRemovalPolicy(): RemovalPolicy {
    const stage = this.node.tryGetContext('stage') || process.env.CDK_STAGE || 'dev';
    
    if (stage === 'prod' || stage === 'production') {
      return RemovalPolicy.RETAIN;
    }
    
    return RemovalPolicy.DESTROY;
  }
}
