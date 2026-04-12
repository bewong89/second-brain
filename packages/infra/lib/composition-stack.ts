import { CfnOutput, Stack, StackProps, aws_dynamodb as dynamodb, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StorageStack } from './storage-stack.js';
import { DatabaseStack } from './database-stack.js';
import { ApiStack } from './api-stack.js';

const STAGE_CONTEXT_KEY = 'stage';

export class SecondBrainStack extends Stack {
  public readonly storageStack: StorageStack;
  public readonly databaseStack: DatabaseStack;
  public readonly apiStack: ApiStack;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.storageStack = new StorageStack(this, 'Storage', props);
    this.databaseStack = new DatabaseStack(this, 'Database', props);
    this.apiStack = new ApiStack(this, 'Api', {
      ...props,
      storageStack: this.storageStack,
      databaseStack: this.databaseStack,
    });

    this.exportOutputs();
  }

  private exportOutputs(): void {
    const stage = this.getStageFromContext();

    new CfnOutput(this, 'StorageBucketName', {
      value: this.storageStack.storageBucket.bucketName,
      description: 'S3 bucket name for brain storage',
      exportName: `${stage}-storage-bucket-name`,
    });

    new CfnOutput(this, 'StorageBucketArn', {
      value: this.storageStack.storageBucket.bucketArn,
      description: 'S3 bucket ARN for brain storage',
      exportName: `${stage}-storage-bucket-arn`,
    });

    new CfnOutput(this, 'AccountsTableName', {
      value: this.databaseStack.accountsTable.tableName,
      description: 'DynamoDB table name for accounts',
      exportName: `${stage}-accounts-table-name`,
    });

    new CfnOutput(this, 'AccountsTableArn', {
      value: this.databaseStack.accountsTable.tableArn,
      description: 'DynamoDB table ARN for accounts',
      exportName: `${stage}-accounts-table-arn`,
    });

    new CfnOutput(this, 'ApiKeysTableName', {
      value: this.databaseStack.apiKeysTable.tableName,
      description: 'DynamoDB table name for API keys',
      exportName: `${stage}-api-keys-table-name`,
    });

    new CfnOutput(this, 'ApiKeysTableArn', {
      value: this.databaseStack.apiKeysTable.tableArn,
      description: 'DynamoDB table ARN for API keys',
      exportName: `${stage}-api-keys-table-arn`,
    });

    new CfnOutput(this, 'ApiEndpointUrl', {
      value: this.apiStack.apiEndpointUrl,
      description: 'API Gateway endpoint URL',
      exportName: `${stage}-api-endpoint`,
    });

    new CfnOutput(this, 'ApiId', {
      value: this.apiStack.apiId,
      description: 'API Gateway API ID',
      exportName: `${stage}-api-id`,
    });
  }

  private getStageFromContext(): string {
    const stageFromContext = this.node.tryGetContext(STAGE_CONTEXT_KEY);
    if (stageFromContext) {
      return stageFromContext;
    }

    const stageFromEnv = process.env.CDK_STAGE;
    if (stageFromEnv) {
      return stageFromEnv;
    }

    return 'dev';
  }
}

export type StorageStackBucket = s3.Bucket;

export type DatabaseStackTables = {
  accountsTable: dynamodb.Table;
  apiKeysTable: dynamodb.Table;
};