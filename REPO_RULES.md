# Repository Rules

## Project Overview

Second Brain is a knowledge management system that provides AI agents with
structured contextual knowledge. It stores markdown files in S3 organized by
entity and agent, and exposes them via an MCP server that AI agents connect to.

Architecture: MCP Server (local binary) -> Backend API (API Gateway + Lambda)
-> S3 + DynamoDB

## Monorepo Structure

This is a pnpm workspaces monorepo. All packages live under `packages/`.

| Package       | Scope Name                  | Purpose                                    |
| ------------- | --------------------------- | ------------------------------------------ |
| `interfaces`  | `@second-brain/interfaces`  | Shared types, enums, constants, utilities   |
| `mcp-server`  | `@second-brain/mcp-server`  | Local MCP server (compiles to binary)       |
| `api`         | `@second-brain/api`         | Backend API Lambda handlers + admin CLI     |
| `infra`       | `@second-brain/infra`       | AWS CDK infrastructure stacks               |

**Dependency rule:** `interfaces` is the shared foundation. All other packages
may depend on `interfaces`. No other cross-package dependencies are permitted
unless explicitly discussed. `infra` references `api` only for Lambda bundling.

## Technology Stack

- Runtime: Node.js (LTS)
- Language: TypeScript (strict mode)
- Package manager: pnpm (workspaces)
- Testing: Vitest
- Validation: Zod
- MCP SDK: @modelcontextprotocol/sdk
- AWS SDK: @aws-sdk/* (v3, modular clients)
- Infrastructure: AWS CDK (TypeScript)

## TypeScript Conventions

- All packages extend `tsconfig.base.json` at the repo root
- Strict mode is always on -- no `any` types unless explicitly justified with a
  comment
- Module resolution: NodeNext
- Target: ES2022
- Use `interface` for object shapes that will be implemented or extended; use
  `type` for unions, intersections, and utility types
- Prefer named exports over default exports
- All public API surface of a package must be exported through its barrel
  `index.ts`

## Naming Conventions

### Files and directories
- All filenames: kebab-case (e.g. `entity-type.ts`, `list-entities.ts`)
- Test files: colocated as `<name>.test.ts` next to the source file
- No `index.ts` files except as barrel exports at package `src/` root

### Code
- Interfaces/types: PascalCase (e.g. `EntityMetadata`, `BrainFile`)
- Enums: PascalCase name, UPPER_SNAKE_CASE members are NOT used -- use
  PascalCase members with explicit lowercase string values
  (e.g. `EntityType.Personal = 'personal'`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE for module-level constants
  (e.g. `ENTITY_SECTIONS`)
- Zod schemas: camelCase suffixed with `Schema`
  (e.g. `entityMetadataSchema`)

### S3 / Domain naming
- Entity folder: `{internalId}-{entityType}-{entityId}`
- Agent folder: `agent-{agent-name}` where agent-name matches
  `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- Entity sections: `personality/`, `skills/`, `rules/` (lowercase, as defined
  in EntitySection enum)
- All brain content files: `.md` extension

## S3 Folder Structure

```
{bucket}/
  {internalId}-{entityType}-{entityId}/
    metadata.json
    agent-{agent-name}/
      metadata.json
      personality/*.md
      skills/*.md
      rules/*.md
```

Never write to S3 directly from application code outside the `api` package.
All S3 writes go through the API service layer.

## API Conventions

### Endpoints
- User endpoints: `GET /api/...` -- authenticated via API key, scoped to
  the account that owns the key
- Admin endpoints: `POST /admin/...` -- authenticated via admin API key
- All request/response bodies are JSON
- All handlers validate input with Zod schemas before processing

### HTTP responses
- 200: Success
- 201: Resource created
- 400: Validation error (include Zod error details)
- 401: Missing or invalid API key
- 403: Authenticated but not authorized for this resource
- 404: Resource not found
- 500: Internal error (do not leak stack traces)

### Handler structure
Each Lambda handler file exports a single handler function. Shared logic
lives in the `services/` directory. Handlers are thin -- they validate input,
call a service, and format the response.

## Error Handling

- Define custom error classes in the `interfaces` package for domain errors
  (e.g. `NotFoundError`, `AuthenticationError`, `AuthorizationError`,
  `ValidationError`)
- Services throw these typed errors
- Lambda handlers catch errors at the boundary and map them to HTTP status
  codes
- MCP server tools catch errors and return them as MCP error responses
- Never swallow errors silently -- always log or rethrow
- Include contextual information in error messages
  (e.g. "Entity not found: abc123-personal-usr_001")

## Testing

- Framework: Vitest
- Unit tests are required for all service classes and utility functions
- Test files are colocated: `foo.ts` -> `foo.test.ts`
- Mock external dependencies (S3, DynamoDB) in unit tests -- do not make
  real AWS calls
- Use descriptive test names: `it('returns empty array when account has
  no entities')`
- Run tests with `pnpm test` at root (runs all packages) or
  `pnpm --filter <package> test` for a single package

## Git Conventions

### Branch naming
- `feat/<scope>-<description>` -- new feature
  (e.g. `feat/epic-2-interfaces`)
- `fix/<scope>-<description>` -- bug fix
- `chore/<scope>-<description>` -- maintenance, deps, config
- `refactor/<scope>-<description>` -- code restructuring

### Commit messages
Follow Conventional Commits (https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`
Scopes: `interfaces`, `mcp-server`, `api`, `infra`, or omit for repo-wide

Examples:
- `feat(interfaces): add EntityMetadata and AgentMetadata types`
- `fix(api): handle missing metadata.json gracefully`
- `chore: update pnpm lockfile`

## Environment and Configuration

- Never commit secrets, credentials, or API keys
- Use `.env.example` as a template -- copy to `.env` for local use
- `.env` is in `.gitignore`
- The MCP server reads user config from `~/.second-brain/config.json`
- Lambda functions receive config via environment variables set in CDK
- Validate all configuration at startup with Zod -- fail fast on
  missing/invalid values

## Security

- API keys are stored as SHA-256 hashes in DynamoDB -- never store raw keys
- Raw API keys are shown exactly once at creation time
- All user endpoints enforce ownership: the authenticated account must own
  the requested entity
- Admin endpoints require the `isAdmin` flag on the account
- S3 bucket is private -- no public access
- Lambda IAM roles follow least-privilege: only the permissions needed for
  their specific operations
- Never log full API keys -- log only the keyId prefix for debugging

## Agent Workflow

### Using the `coder` Subagent

Use the `@coder` subagent for implementing features, fixing bugs, or making
code changes. It works in isolated git worktrees to keep `main` clean.

**Invoking the coder:**
```
@coder <task description>
```

**Workflow per task:**
1. Create a new worktree: `git worktree add ../second-brain-{branch-name} -b {branch-name} origin/main`
2. Navigate to the worktree: `cd /Users/bewong/Development/second-brain-{branch-name}`
3. Read `REPO_RULES.md` from the worktree root and follow all conventions
4. Implement the required changes
5. Commit: `git add . && git commit -m "<conventional-commit-message>"`
6. Push the branch: `git push -u origin {branch-name}`
7. Create a GitHub PR: `gh pr create --title "<title>" --body "<body>"`
8. Report back with: worktree path, branch name, commit hash, PR URL

**Parallelism:** Tasks with no dependencies on each other are run in parallel by
launching multiple `@coder` agents simultaneously. Tasks with dependencies are run
sequentially -- each coder completes and its PR is merged before the next task starts.

**PR descriptions must include:**
- What was implemented
- What files changed
- Any relevant dependency notes (e.g. "Depends on PR #N -- must merge after")

## Adding a New Package

1. Create directory under `packages/<name>/`
2. Add `package.json` with scope `@second-brain/<name>`
3. Add `tsconfig.json` extending `../../tsconfig.base.json`
4. Add `src/index.ts` as the barrel export
5. Add the package to any CI/build scripts
6. If it depends on `interfaces`, add
   `"@second-brain/interfaces": "workspace:*"` to dependencies
