import {
  CfnOutput,
  Duration,
  Stack,
  StackProps,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

const STAGE_CONTEXT_KEY = 'stage';

/**
 * APIStack - API Gateway infrastructure for Second Brain
 *
 * Creates a REST API with user and admin endpoints backed by Lambda functions.
 * Uses Lambda proxy integration for all endpoints.
 */
export class ApiStack extends Stack {
  /** The REST API instance */
  public readonly api: apigateway.RestApi;

  /** The API endpoint URL */
  public readonly apiEndpointUrl: string;

  /** The API ID */
  public readonly apiId: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stage = this.getStageFromContext();

    // Create the REST API
    this.api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `second-brain-${stage}-api`,
      description: `Second Brain API for ${stage} stage`,
      deploy: true,
      deployOptions: {
        stageName: stage,
        cachingEnabled: false,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
      },
    });

    this.apiEndpointUrl = this.api.url;
    this.apiId = this.api.restApiId;

    // Create Lambda functions for user endpoints
    const listEntitiesFunction = this.createLambdaFunction(
      'ListEntities',
      stage
    );
    const listAgentsFunction = this.createLambdaFunction(
      'ListAgents',
      stage
    );
    const getAgentFunction = this.createLambdaFunction('GetAgent', stage);
    const getSectionFunction = this.createLambdaFunction('GetSection', stage);

    // Create Lambda functions for admin endpoints
    const createAccountFunction = this.createLambdaFunction(
      'CreateAccount',
      stage
    );
    const createApiKeyFunction = this.createLambdaFunction('CreateApiKey', stage);
    const createEntityFunction = this.createLambdaFunction(
      'CreateEntity',
      stage
    );
    const createAgentFunction = this.createLambdaFunction('CreateAgent', stage);

    // Setup user endpoints with API key requirement
    this.setupUserEndpoints(listEntitiesFunction, listAgentsFunction, getAgentFunction, getSectionFunction);

    // Setup admin endpoints
    this.setupAdminEndpoints(
      createAccountFunction,
      createApiKeyFunction,
      createEntityFunction,
      createAgentFunction
    );

    // Export outputs
    new CfnOutput(this, 'ApiEndpointUrl', {
      value: this.api.url,
      description: 'API Endpoint URL',
      exportName: `${stage}-api-endpoint`,
    });

    new CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API ID',
      exportName: `${stage}-api-id`,
    });
  }

  /**
   * Creates a Lambda function with the given name
   */
  private createLambdaFunction(name: string, stage: string): lambda.Function {
    return new lambda.Function(this, name, {
      functionName: `second-brain-${stage}-${this.toKebabCase(name)}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return { statusCode: 200, body: JSON.stringify({ message: '${name} stub' }) };
        };
      `),
      timeout: Duration.seconds(30),
      memorySize: 256,
    });
  }

  /**
   * Converts a string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Sets up user endpoints at /api/*
   * These require API key authentication
   */
  private setupUserEndpoints(
    listEntitiesFn: lambda.Function,
    listAgentsFn: lambda.Function,
    getAgentFn: lambda.Function,
    getSectionFn: lambda.Function
  ): void {
    const apiResource = this.api.root.addResource('api');

    // GET /api/entities
    const entitiesResource = apiResource.addResource('entities');
    entitiesResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listEntitiesFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // GET /api/entities/{entityId}/agents
    const entityResource = entitiesResource.addResource('{entityId}');
    const agentsResource = entityResource.addResource('agents');
    agentsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(listAgentsFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // GET /api/entities/{entityId}/agents/{agentName}
    const agentResource = agentsResource.addResource('{agentName}');
    agentResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getAgentFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // GET /api/entities/{entityId}/agents/{agentName}/sections/{section}
    const sectionsResource = agentResource.addResource('sections');
    const sectionResource = sectionsResource.addResource('{section}');
    sectionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getSectionFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // Enable CORS for all user endpoints
    this.addCorsOptions(entitiesResource);
    this.addCorsOptions(entityResource);
    this.addCorsOptions(agentsResource);
    this.addCorsOptions(agentResource);
    this.addCorsOptions(sectionResource);
  }

  /**
   * Sets up admin endpoints at /admin/*
   * These require admin API key authentication
   */
  private setupAdminEndpoints(
    createAccountFn: lambda.Function,
    createApiKeyFn: lambda.Function,
    createEntityFn: lambda.Function,
    createAgentFn: lambda.Function
  ): void {
    const adminResource = this.api.root.addResource('admin');

    // POST /admin/accounts
    const accountsResource = adminResource.addResource('accounts');
    accountsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createAccountFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '201',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // POST /admin/api-keys
    const apiKeysResource = adminResource.addResource('api-keys');
    apiKeysResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createApiKeyFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '201',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // POST /admin/entities
    const entitiesResource = adminResource.addResource('entities');
    entitiesResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createEntityFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '201',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // POST /admin/entities/{entityId}/agents
    const entityResource = entitiesResource.addResource('{entityId}');
    const agentsResource = entityResource.addResource('agents');
    agentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(createAgentFn, { proxy: true }),
      {
        apiKeyRequired: true,
        methodResponses: [
          {
            statusCode: '201',
            responseModels: { 'application/json': apigateway.Model.EMPTY_MODEL },
          },
        ],
      }
    );

    // Enable CORS for all admin endpoints
    this.addCorsOptions(accountsResource);
    this.addCorsOptions(apiKeysResource);
    this.addCorsOptions(entitiesResource);
    this.addCorsOptions(entityResource);
    this.addCorsOptions(agentsResource);
  }

  /**
   * Adds CORS options to an API resource
   */
  private addCorsOptions(resource: apigateway.Resource): void {
    resource.addMethod(
      'OPTIONS',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: [
              ['method.response.header.Access-Control-Allow-Headers', "'Content-Type,Authorization,X-Api-Key'"],
              ['method.response.header.Access-Control-Allow-Methods', "'GET,POST,OPTIONS'"],
              ['method.response.header.Access-Control-Allow-Origin', "'*'"],
            ],
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      })
    );
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