#!/usr/bin/env node
import { Command } from 'commander';
import { getProvider } from '../providers/provider-registry';
import { detectDrift } from '../drift/detector';
import { formatReport, formatReportJson } from '../drift/formatter';
import '../providers/dotenv-provider';
import '../providers/aws-ssm-provider';
import '../providers/aws-secrets-provider';
import '../providers/gcp-secret-provider';

const program = new Command();

program
  .name('driftcheck')
  .description('Detect configuration drift between staging and production environments')
  .version('0.1.0');

program
  .command('check')
  .description('Compare environment variables between two sources')
  .requiredOption('--staging <uri>', 'Staging environment source URI')
  .requiredOption('--production <uri>', 'Production environment source URI')
  .option('--format <format>', 'Output format: text or json', 'text')
  .option('--ignore <keys>', 'Comma-separated list of keys to ignore')
  .action(async (opts) => {
    const ignoreKeys = opts.ignore
      ? opts.ignore.split(',').map((k: string) => k.trim())
      : [];

    const stagingProvider = getProvider(opts.staging);
    const productionProvider = getProvider(opts.production);

    if (!stagingProvider) {
      console.error(`No provider found for staging URI: ${opts.staging}`);
      process.exit(1);
    }

    if (!productionProvider) {
      console.error(`No provider found for production URI: ${opts.production}`);
      process.exit(1);
    }

    const stagingVars = await stagingProvider.load(opts.staging);
    const productionVars = await productionProvider.load(opts.production);

    const report = detectDrift(stagingVars, productionVars, { ignoreKeys });

    if (opts.format === 'json') {
      console.log(formatReportJson(report));
    } else {
      console.log(formatReport(report));
    }

    if (report.driftEntries.length > 0) {
      process.exit(1);
    }
  });

program
  .command('providers')
  .description('List all registered providers')
  .action(() => {
    const { listProviders } = require('../providers/provider-registry');
    const providers = listProviders();
    if (providers.length === 0) {
      console.log('No providers registered.');
    } else {
      console.log('Registered providers:');
      providers.forEach((name: string) => console.log(`  - ${name}`));
    }
  });

program.parse(process.argv);
