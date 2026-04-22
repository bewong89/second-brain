/**
 * Admin CLI Entry Point
 *
 * Administrative commands for Second Brain API.
 * Usage: pnpm --filter @second-brain/api admin <command>
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createAccount } from './commands/create-account.js';
import { createApiKey } from './commands/create-api-key.js';
import { createEntity } from './commands/create-entity.js';
import { createAgent } from './commands/create-agent.js';

interface CreateAccountArgs {
  name: string;
}

interface CreateApiKeyArgs {
  'account-id': string;
}

interface CreateEntityArgs {
  'account-id': string;
  'entity-name': string;
}

interface CreateAgentArgs {
  'entity-id': string;
  'agent-name': string;
}

export const cli = yargs()
  .scriptName('admin')
  .usage('$0 <command> [options]')
  .help()
  .version('1.0.0')
  .demandCommand(1, 'Please specify a command')
  .command<CreateAccountArgs>(
    'create-account',
    'Create a new account',
    (yargs) =>
      yargs.option('name', {
        alias: 'n',
        describe: 'Account name',
        type: 'string',
        demandOption: true,
      }),
    async (argv) => {
      await createAccount(argv.name);
    }
  )
  .command<CreateApiKeyArgs>(
    'create-api-key',
    'Create an API key for an account',
    (yargs) =>
      yargs.option('account-id', {
        alias: 'a',
        describe: 'Account ID',
        type: 'string',
        demandOption: true,
      }),
    async (argv) => {
      await createApiKey(argv['account-id']);
    }
  )
  .command<CreateEntityArgs>(
    'create-entity',
    'Create a new entity folder',
    (yargs) =>
      yargs
        .option('account-id', {
          alias: 'a',
          describe: 'Account ID',
          type: 'string',
          demandOption: true,
        })
        .option('entity-name', {
          alias: 'e',
          describe: 'Entity name',
          type: 'string',
          demandOption: true,
        }),
    async (argv) => {
      await createEntity(argv['account-id'], argv['entity-name']);
    }
  )
  .command<CreateAgentArgs>(
    'create-agent',
    'Create a new agent folder',
    (yargs) =>
      yargs
        .option('entity-id', {
          alias: 'e',
          describe: 'Entity ID',
          type: 'string',
          demandOption: true,
        })
        .option('agent-name', {
          alias: 'a',
          describe: 'Agent name',
          type: 'string',
          demandOption: true,
        }),
    async (argv) => {
      await createAgent(argv['entity-id'], argv['agent-name']);
    }
  )
  .example('$0 create-account --name "My Account"', 'Create a new account')
  .example('$0 create-api-key --account-id "abc123"', 'Create an API key for account abc123')
  .example('$0 create-entity --account-id "abc123" --entity-name "my-entity"', 'Create entity folder')
  .example('$0 create-agent --entity-id "entity-123" --agent-name "my-agent"', 'Create agent folder');

// Run CLI if called directly
cli.parse(hideBin(process.argv));