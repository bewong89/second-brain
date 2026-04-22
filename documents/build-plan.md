# Second Brain -- Build Plan

## Epic 1: Project Foundation

| #   | Task                      | Description                                                                                          | Status |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| 1.1 | Root workspace            | Create root `package.json`, `pnpm-workspace.yaml` (pointing to `packages/*`), `.gitignore`, `.env.example` | Done   |
| 1.2 | Shared TypeScript config  | Create `tsconfig.base.json` (strict, ES2022, NodeNext)                                               | Done   |
| 1.3 | Package scaffolds         | Create empty `package.json` + `tsconfig.json` for all four packages: `interfaces`, `mcp-server`, `api`, `infra` | Done   |
| 1.4 | Dependency install        | `pnpm install` to validate workspace resolution                                                     | Done   |

## Epic 2: Interfaces Package

| #   | Task                 | Description                                                                                                    | Status |
| --- | -------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| 2.1 | Enums                | Define `EntityType` (PERSONAL) and `EntitySection` (PERSONALITY, SKILLS, RULES) enums. Define `ENTITY_SECTIONS` constant. | Done   |
| 2.2 | Entity types         | Define `EntityMetadata` interface matching entity metadata.json schema                                         | Done   |
| 2.3 | Agent types          | Define `AgentMetadata` interface matching agent metadata.json schema                                           | Done   |
| 2.4 | Brain content types  | Define `BrainFile`, `BrainSection`, `BrainAgent`, `BrainEntity`                                                | Done   |
| 2.5 | Account types        | Define `Account`, `ApiKey` interfaces                                                                          | Done   |
| 2.6 | Path utilities       | Implement `buildEntityFolderName`, `parseEntityFolderName`, `buildAgentFolderName`, `parseAgentFolderName`, `validateAgentName` | Done   |
| 2.7 | Package exports      | Create barrel `index.ts`, configure `package.json` exports, verify compilation                                 | Done   |

## Epic 3: Infrastructure (CDK)

| #   | Task                          | Description                                                                                                                                            | Status |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 3.1 | CDK init                      | Set up `cdk.json`, `bin/app.ts`, install CDK dependencies                                                                                              | Done   |
| 3.2 | StorageStack                  | S3 bucket (versioned, private, stage-parameterized name)                                                                                               | Done   |
| 3.3 | DatabaseStack                 | DynamoDB Accounts table (PK: accountId) + ApiKeys table (PK: keyId, GSI on accountId)                                                                  | Done   |
| 3.4 | ApiStack -- Lambda functions  | Create Lambda functions for user endpoints (list-entities, list-agents, get-agent, get-section) and admin endpoints (create-account, create-api-key, create-entity, create-agent). Wire IAM permissions to S3 + DynamoDB. | Done   |
| 3.5 | ApiStack -- API Gateway       | REST API with `/api/*` and `/admin/*` route trees, Lambda proxy integrations                                                                           | Done   |
| 3.6 | Composition stack             | `SecondBrainStack` that composes Storage + Database + Api stacks, passes references between them                                                       | Done   |
| 3.7 | Synth and deploy              | Verify `cdk synth` produces valid CloudFormation, deploy to AWS                                                                                        | Done   |

## Epic 4: Backend API

| #   | Task                       | Description                                                                                                                                              | Status |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 4.1 | Package setup              | Install dependencies (`@aws-sdk/client-s3`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `zod`), configure build                                | Done   |
| 4.2 | Auth middleware             | Implement API key extraction, DynamoDB lookup, hash comparison, account context injection                                                                | Done   |
| 4.3 | S3 service                 | Implement `listEntityFolders(accountId)`, `getEntityMetadata(folderId)`, `listAgents(folderId)`, `getAgentMetadata(folderId, agentName)`, `listSectionFiles(folderId, agentName, section)`, `getFileContent(...)`, `getFullAgent(folderId, agentName)` | Done   |
| 4.4 | Account service            | Implement `createAccount`, `getAccount` in DynamoDB                                                                                                      | Done   |
| 4.5 | API key service            | Implement `generateApiKey`, `validateApiKey`, `revokeApiKey` in DynamoDB                                                                                 | Done   |
| 4.6 | User endpoint handlers     | Implement GET handlers: list-entities, list-agents, get-agent, get-section. Each validates auth + ownership.                                             | Done   |
| 4.7 | Admin endpoint handlers    | Implement POST handlers: create-account, create-api-key, create-entity (creates S3 folder + metadata), create-agent (creates S3 agent folder + metadata) | Done   |
| 4.8 | Admin CLI                  | CLI script wrapping admin endpoint logic for local use: `admin create-account`, `admin create-api-key`, `admin create-entity`, `admin create-agent`      |        |
| 4.9 | Authorization enforcement  | Ensure user endpoints verify `metadata.accountId === authenticated accountId`                                                                            |        |

## Epic 5: MCP Server

| #    | Task                        | Description                                                                                | Status |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| 5.1  | Package setup               | Install dependencies (`@modelcontextprotocol/sdk`, `zod`), configure build                 |        |
| 5.2  | Config module               | Load and validate `~/.second-brain/config.json` (apiKey, apiEndpoint)                      |        |
| 5.3  | Setup command               | Implement `second-brain setup` -- prompt for API key, validate against backend API, save config |        |
| 5.4  | API client                  | HTTP client that calls backend API with API key auth. Methods mirror the user endpoints.   |        |
| 5.5  | MCP tool: `list_entities`   | Register tool, call API client, return entity list                                         |        |
| 5.6  | MCP tool: `list_agents`     | Register tool, call API client, return agent list for entity                               |        |
| 5.7  | MCP tool: `get_agent`       | Register tool, call API client, return full agent context                                  |        |
| 5.8  | MCP tool: `get_section`     | Register tool, call API client, return section files                                       |        |
| 5.9  | MCP resources               | Register `brain:///` URI scheme for resource browsing                                      |        |
| 5.10 | Server bootstrap            | Wire tools + resources into MCP server, start stdio transport via `second-brain serve`     |        |
| 5.11 | Dev mode                    | Support running from source with `pnpm dev` for local development                         |        |

## Epic 6: Binary Distribution

| #   | Task                     | Description                                                                                 | Status |
| --- | ------------------------ | ------------------------------------------------------------------------------------------- | ------ |
| 6.1 | Build pipeline           | Configure esbuild/pkg/Node SEA to compile MCP server to standalone binaries                 |        |
| 6.2 | Multi-platform targets   | Build for macOS arm64, macOS x64, Linux x64, Windows x64                                    |        |
| 6.3 | GitHub Release setup     | Create GitHub Actions workflow to build and publish binaries on tag push                     |        |
| 6.4 | Smoke test               | Verify binary runs `setup` and `serve` on each target platform                              |        |

## Epic 7: Integration & Validation

| #   | Task                    | Description                                                                                             | Status |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| 7.1 | Seed data               | Create sample entity + agents with .md files, upload via admin CLI                                      |        |
| 7.2 | End-to-end test         | Full flow: create account -> generate API key -> setup MCP server -> call all tools -> verify data      |        |
| 7.3 | MCP inspector test      | Verify all tools and resources with `@modelcontextprotocol/inspector`                                   |        |
| 7.4 | Claude Desktop test     | Configure Claude Desktop with the MCP server, verify agent loads brain context                          |        |

## Build Order

```
Epic 1 --> Epic 2 --+--> Epic 3 --+--> Epic 4 --> Epic 5 --> Epic 6 --> Epic 7
                    |             |
                    +-------------+
                    (parallel OK)
```

- Epic 2 (interfaces) must complete before Epics 3, 4, and 5 since they all depend on shared types.
- Epics 3 and 4 can overlap -- CDK can be deployed while API handler code is written, then redeployed.
- Epic 5 depends on Epic 4 (MCP server calls the backend API).
- Epic 6 depends on Epic 5.
- Epic 7 depends on everything.
