import { Duration, Stack, StackProps, aws_s3 as s3 } from 'aws-cdk-lib';
import { Construct } from 'constructs';

const STAGE_CONTEXT_KEY = 'stage';

/**
 * StorageStack - S3 storage infrastructure for Second Brain
 *
 * Creates a versioned, private S3 bucket with stage-parameterized naming.
 * The bucket is intended to store brain content and metadata files.
 */
export class StorageStack extends Stack {
  /** The main S3 bucket for brain storage */
  public readonly storageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = this.getStageFromContext();

    this.storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: `second-brain-${stage}-storage`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // Lifecycle rules for intelligent tiering
      lifecycleRules: [
        {
          id: 'IntelligentTieringRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: undefined, // Move to intelligent tiering immediately
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: Duration.days(90),
            },
          ],
        },
      ],

      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,

      // Enforce TLS
      enforceSSL: true,
    });
  }

  /**
   * Gets the stage from CDK context or environment variables.
   * Defaults to 'dev' if neither is provided.
   */
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