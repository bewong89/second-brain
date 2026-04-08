# Second Brain -- System Design

## 1. Architecture Overview

```
User's Machine                                    AWS Cloud
+--------------+    stdio    +----------------+    HTTPS    +-----------------------------------------+
|              |<----------->|                |<----------->|          API Gateway                    |
|   AI Agent   |  MCP Proto  |  MCP Server    |  API Key    |              |                          |
|              |             |  (binary)      |   auth      |    +---------+---------+                |
+--------------+             +----------------+             |    |                   |                |
                                    |                       |    v                   v                |
                                    | one-time              |  /api/*            /admin/*             |
                                    | setup                 |  Lambda             Lambda              |
                                    v                       |    |                   |                |
                             ~/.second-brain/               |    v                   v                |
                              config.json                   |  +-----+  +----------+  +-----------+  |
                                                            |  | S3  |  | DynamoDB |  | DynamoDB  |  |
                                                            |  | Bkt |  | Accounts |  | ApiKeys   |  |
                                                            |  +-----+  +----------+  +-----------+  |
                                                            +-----------------------------------------+
                                                                          ^
                                                                          | direct access
                                                                   +------+-------+
                                                                   |  Admin CLI   |
                                                                   |  (dev tool)  |
                                                                   +--------------+
```

The system has four runtime components:

1. **MCP Server** -- local binary, communicates with AI agents via stdio and fetches brain content from the backend API using an API key.
2. **Backend API** -- API Gateway + Lambda. Authenticates requests via API key, reads from S3 and DynamoDB. Serves both user-facing read endpoints and admin provisioning endpoints.
3. **S3 Bucket** -- stores all brain content (markdown files, metadata) in a structured folder hierarchy.
4. **DynamoDB Tables** -- stores account and API key data for authentication and authorization.

## 2. Repository Structure

```
second-brain/
|-- packages/
|   |-- interfaces/                 # Shared types, enums, schemas
|   |   |-- src/
|   |   |   |-- index.ts
|   |   |   |-- enums/
|   |   |   |   |-- entity-type.ts
|   |   |   |   +-- entity-section.ts
|   |   |   |-- types/
|   |   |   |   |-- account.ts
|   |   |   |   |-- metadata.ts
|   |   |   |   |-- agent.ts
|   |   |   |   +-- brain.ts
|   |   |   +-- utils/
|   |   |       +-- paths.ts
|   |   |-- package.json
|   |   +-- tsconfig.json
|   |
|   |-- mcp-server/                 # Local MCP server (compiles to binary)
|   |   |-- src/
|   |   |   |-- index.ts            # Entry: bootstrap MCP server
|   |   |   |-- setup.ts            # `second-brain setup` flow
|   |   |   |-- config.ts           # Load ~/.second-brain/config.json
|   |   |   |-- api-client/
|   |   |   |   +-- client.ts       # HTTP client for backend API
|   |   |   |-- tools/
|   |   |   |   |-- list-entities.ts
|   |   |   |   |-- list-agents.ts
|   |   |   |   |-- get-agent.ts
|   |   |   |   +-- get-section.ts
|   |   |   +-- resources/
|   |   |       +-- brain.ts
|   |   |-- package.json
|   |   +-- tsconfig.json
|   |
|   |-- api/                        # Backend API (Lambda handlers + admin CLI)
|   |   |-- src/
|   |   |   |-- handlers/
|   |   |   |   |-- user/           # API-key-authed endpoints
|   |   |   |   |   |-- list-entities.ts
|   |   |   |   |   |-- list-agents.ts
|   |   |   |   |   |-- get-agent.ts
|   |   |   |   |   +-- get-section.ts
|   |   |   |   +-- admin/          # Admin endpoints
|   |   |   |       |-- create-account.ts
|   |   |   |       |-- create-api-key.ts
|   |   |   |       |-- create-entity.ts
|   |   |   |       +-- create-agent.ts
|   |   |   |-- middleware/
|   |   |   |   +-- auth.ts         # API key validation
|   |   |   |-- services/
|   |   |   |   |-- s3.ts           # S3 read operations
|   |   |   |   |-- accounts.ts     # DynamoDB account operations
|   |   |   |   +-- api-keys.ts     # DynamoDB API key operations
|   |   |   +-- cli/
|   |   |       +-- admin.ts        # Admin CLI entry point
|   |   |-- package.json
|   |   +-- tsconfig.json
|   |
|   +-- infra/                      # AWS CDK
|       |-- bin/
|       |   +-- app.ts
|       |-- lib/
|       |   |-- storage-stack.ts    # S3 bucket
|       |   |-- database-stack.ts   # DynamoDB tables
|       |   |-- api-stack.ts        # API Gateway + Lambda
|       |   +-- second-brain-stack.ts  # Composition stack
|       |-- cdk.json
|       |-- package.json
|       +-- tsconfig.json
|
|-- pnpm-workspace.yaml
|-- package.json
|-- tsconfig.base.json
|-- .env.example
+-- .gitignore
```

## 3. S3 Bucket Structure

```
second-brain-{stage}/
+-- {internalId}-{entityType}-{entityId}/
    |-- metadata.json
    |-- agent-{agent-name}/
    |   |-- metadata.json
    |   |-- personality/
    |   |   +-- *.md
    |   |-- skills/
    |   |   +-- *.md
    |   +-- rules/
    |       +-- *.md
    +-- agent-{agent-name}/
        |-- metadata.json
        |-- personality/
        |   +-- *.md
        |-- skills/
        |   +-- *.md
        +-- rules/
            +-- *.md
```

**Concrete example:**

```
second-brain-prod/
+-- a1b2c3-personal-usr_001/
    |-- metadata.json
    |-- agent-code-assistant/
    |   |-- metadata.json
    |   |-- personality/
    |   |   |-- overview.md
    |   |   +-- communication-style.md
    |   |-- skills/
    |   |   |-- typescript.md
    |   |   +-- testing.md
    |   +-- rules/
    |       |-- code-standards.md
    |       +-- review-guidelines.md
    +-- agent-writing-helper/
        |-- metadata.json
        |-- personality/
        |   +-- tone.md
        |-- skills/
        |   +-- technical-writing.md
        +-- rules/
            +-- formatting.md
```

**Naming constraints:**

- Entity folder: `{internalId}-{entityType}-{entityId}` -- internalId is a generated short ID, entityType is lowercase enum value, entityId is an external system ID
- Agent folder: `agent-{agent-name}` -- agent-name must be lowercase alphanumeric with hyphens only (`/^[a-z0-9]+(-[a-z0-9]+)*$/`)

## 4. Data Schemas

### 4.1 Entity metadata.json

```json
{
  "internalId": "a1b2c3",
  "entityType": "personal",
  "entityId": "usr_001",
  "accountId": "acct_8f3k2",
  "name": "My Second Brain",
  "createdAt": "2026-04-08T00:00:00.000Z",
  "updatedAt": "2026-04-08T00:00:00.000Z"
}
```

### 4.2 Agent metadata.json

```json
{
  "agentName": "code-assistant",
  "displayName": "Code Assistant",
  "description": "Specializes in TypeScript development and code review",
  "createdAt": "2026-04-08T00:00:00.000Z",
  "updatedAt": "2026-04-08T00:00:00.000Z"
}
```

### 4.3 DynamoDB: Accounts Table

| Attribute        | Type   | Description          |
| ---------------- | ------ | -------------------- |
| `accountId` (PK) | String | `acct_{shortId}`     |
| `name`           | String | Account display name |
| `email`          | String | Contact email        |
| `status`         | String | `active`/`suspended` |
| `isAdmin`        | Boolean| Admin flag           |
| `createdAt`      | String | ISO 8601             |
| `updatedAt`      | String | ISO 8601             |

### 4.4 DynamoDB: ApiKeys Table

| Attribute      | Type   | Description                                        |
| -------------- | ------ | -------------------------------------------------- |
| `keyId` (PK)  | String | Short prefix portion of the key, used for lookup   |
| `accountId`    | String | FK to Accounts                                     |
| `keyHash`      | String | SHA-256 hash of the full API key                   |
| `status`       | String | `active`/`revoked`                                 |
| `createdAt`    | String | ISO 8601                                           |

GSI: `accountId-index` on `accountId` for listing keys per account.

**API key format:** `sb_{keyId}_{random}` (e.g. `sb_k8f3x_a7b2c9d4e5f6...`). The `keyId` segment is used for DynamoDB lookup; the full key is hashed and compared to `keyHash` for validation.

## 5. Backend API Design

### 5.1 Authentication

All requests carry `Authorization: Bearer sb_k8f3x_...` header. The auth middleware:

1. Extracts `keyId` from the token
2. Looks up `keyId` in the ApiKeys table
3. Hashes the full token and compares to stored `keyHash`
4. If valid, attaches `accountId` to the request context
5. Admin endpoints additionally check the `isAdmin` flag on the account

### 5.2 User Endpoints (API key auth)

| Method | Path                                                        | Description                                         |
| ------ | ----------------------------------------------------------- | --------------------------------------------------- |
| `GET`  | `/api/entities`                                             | List entities for the authenticated account         |
| `GET`  | `/api/entities/:folderId`                                   | Get entity metadata                                 |
| `GET`  | `/api/entities/:folderId/agents`                            | List agents in an entity                            |
| `GET`  | `/api/entities/:folderId/agents/:agentName`                 | Get full agent context (metadata + all section files)|
| `GET`  | `/api/entities/:folderId/agents/:agentName/sections/:section`| Get all files in a specific section                 |

### 5.3 Admin Endpoints (admin API key auth)

| Method | Path                                         | Description                                                       |
| ------ | -------------------------------------------- | ----------------------------------------------------------------- |
| `POST` | `/admin/accounts`                            | Create a new account                                              |
| `GET`  | `/admin/accounts/:accountId`                 | Get account details                                               |
| `POST` | `/admin/accounts/:accountId/api-keys`        | Generate a new API key (returns the raw key once)                 |
| `POST` | `/admin/entities`                            | Create entity (body includes accountId, entityType, entityId)     |
| `POST` | `/admin/entities/:folderId/agents`           | Create agent (creates folder structure + metadata in S3)          |

### 5.4 Authorization

User endpoints enforce that the authenticated account owns the requested entity. The API looks up entity metadata from S3 and checks `metadata.accountId === request.accountId`.

## 6. MCP Server Design

### 6.1 Configuration

Stored at `~/.second-brain/config.json`:

```json
{
  "apiKey": "sb_k8f3x_a7b2c9d4e5f6...",
  "apiEndpoint": "https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod"
}
```

### 6.2 Setup Flow

The binary supports a `setup` subcommand:

```
$ second-brain setup
Enter your API key: sb_k8f3x_...
Validating... OK
Configuration saved to ~/.second-brain/config.json
```

### 6.3 MCP Tools

| Tool            | Input Schema                                                                        | Description                                                           |
| --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `list_entities` | `{}`                                                                                | List all brain entities for the account                               |
| `list_agents`   | `{ entityId: string }`                                                              | List agents within an entity                                          |
| `get_agent`     | `{ entityId: string, agentName: string }`                                           | Get full agent context: metadata + all sections with all file contents|
| `get_section`   | `{ entityId: string, agentName: string, section: "personality" \| "skills" \| "rules" }` | Get all files in a specific section                                   |

### 6.4 MCP Resources

| URI Pattern                                                      | Description              |
| ---------------------------------------------------------------- | ------------------------ |
| `brain:///entities`                                              | List of entity folder names with metadata |
| `brain:///entities/{folderId}/agents`                            | List of agents in entity |
| `brain:///entities/{folderId}/agents/{agentName}`                | Full agent context       |
| `brain:///entities/{folderId}/agents/{agentName}/{section}`      | Section file listing     |
| `brain:///entities/{folderId}/agents/{agentName}/{section}/{filename}` | Single file content |

### 6.5 Binary Distribution

- Compiled using Node.js SEA (Single Executable Application) or `pkg`
- Target platforms: macOS arm64, macOS x64, Linux x64, Windows x64
- Distributed via GitHub Releases
- Users download the binary for their platform and place it in PATH

### 6.6 AI Tool Integration

Example Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "/usr/local/bin/second-brain",
      "args": ["serve"]
    }
  }
}
```

## 7. Interfaces Package -- Type Inventory

| Type/Enum        | Fields                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `EntityType`     | `PERSONAL = 'personal'` (extendable)                                     |
| `EntitySection`  | `PERSONALITY = 'personality'`, `SKILLS = 'skills'`, `RULES = 'rules'`    |
| `EntityMetadata` | internalId, entityType, entityId, accountId, name, createdAt, updatedAt  |
| `AgentMetadata`  | agentName, displayName, description, createdAt, updatedAt                |
| `BrainFile`      | name, content, s3Key                                                     |
| `BrainSection`   | section (EntitySection), files (BrainFile[])                             |
| `BrainAgent`     | metadata (AgentMetadata), sections (BrainSection[])                      |
| `BrainEntity`    | metadata (EntityMetadata), folderName, agents (BrainAgent[])             |
| `Account`        | accountId, name, email, status, isAdmin, createdAt, updatedAt            |
| `ApiKey`         | keyId, accountId, status, createdAt                                      |

**Utility functions:**

- `buildEntityFolderName(internalId, entityType, entityId) -> string`
- `parseEntityFolderName(folderName) -> { internalId, entityType, entityId }`
- `buildAgentFolderName(agentName) -> string`
- `parseAgentFolderName(folderName) -> { agentName }`
- `validateAgentName(name) -> boolean` (enforces lowercase-hyphen pattern)
- `ENTITY_SECTIONS` constant array

## 8. User Flows

### 8.1 Account Provisioning (Admin)

```
1. Admin runs CLI or calls admin API:
   POST /admin/accounts { name: "Jane Doe", email: "jane@example.com" }
   -> returns { accountId: "acct_8f3k2" }

2. Admin creates entity for account:
   POST /admin/entities { accountId: "acct_8f3k2", entityType: "personal", entityId: "usr_jane" }
   -> creates S3 folder structure + metadata.json
   -> returns { folderId: "x7y8z9-personal-usr_jane" }

3. Admin creates agent(s):
   POST /admin/entities/x7y8z9-personal-usr_jane/agents { agentName: "code-assistant", displayName: "Code Assistant" }
   -> creates agent folder structure + agent metadata.json in S3

4. Admin seeds .md content into agent sections (manual upload or future content API)

5. Admin generates API key for user:
   POST /admin/accounts/acct_8f3k2/api-keys
   -> returns { apiKey: "sb_k8f3x_a7b2c9..." } (shown once)

6. Admin delivers API key to the user
```

### 8.2 End User Setup (One-Time)

```
1. User receives API key from admin

2. User downloads MCP server binary from GitHub Releases
   (platform-specific: macOS arm64, macOS x64, Linux x64, Windows x64)

3. User places binary in PATH (e.g. /usr/local/bin/second-brain)

4. User runs setup:
   $ second-brain setup
   Enter your API key: sb_k8f3x_a7b2c9...
   Validating key... Connected as "Jane Doe"
   Configuration saved to ~/.second-brain/config.json

5. User configures their AI tool to use the MCP server:
   - Claude Desktop: adds entry to claude_desktop_config.json
   - Other tools: point to `second-brain serve` as stdio MCP server
```

### 8.3 End User Runtime (Ongoing)

```
1. User opens their AI tool (e.g. Claude Desktop)
2. AI tool spawns MCP server: `second-brain serve`
3. MCP server reads ~/.second-brain/config.json
4. AI agent calls list_entities -> sees available brains
5. AI agent calls list_agents -> sees agents for an entity
6. AI agent calls get_agent -> receives full context
   (personality files, skills files, rules files)
7. AI agent uses this context to tailor its behavior for the user's task
```

### 8.4 Developer Flow

```
1. Clone repo, run `pnpm install`
2. Deploy infrastructure: `pnpm --filter @second-brain/infra cdk deploy`
   -> provisions S3, DynamoDB, API Gateway, Lambda
3. Seed test data via admin CLI:
   `pnpm --filter @second-brain/api admin create-account ...`
4. Set API endpoint in .env for local dev
5. Run MCP server in dev mode: `pnpm --filter @second-brain/mcp-server dev`
6. Test with MCP inspector: `npx @modelcontextprotocol/inspector`
```

## 9. Infrastructure (CDK) Design

| Stack               | Resources                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `StorageStack`       | S3 bucket (versioned, private, parameterized name by stage)                                             |
| `DatabaseStack`      | DynamoDB Accounts table, ApiKeys table (with GSI)                                                       |
| `ApiStack`           | API Gateway REST API, Lambda functions (user handlers + admin handlers), IAM roles granting Lambda access to S3 + DynamoDB |
| `SecondBrainStack`   | Composition stack that wires the above together                                                         |
