#!/usr/bin/env node
/**
 * rn-iconify CLI
 * Command-line tools for icon bundling and analysis
 */

import { bundleCommand } from './commands/bundle';
import { analyzeCommand } from './commands/analyze';
import { EXIT_CODES } from './types';
import type { BundleOptions, AnalyzeOptions } from './types';

/**
 * Package version
 */
const VERSION = '1.0.0';

/**
 * Help text
 */
const HELP = `
📦 rn-iconify CLI v${VERSION}

Usage: npx rn-iconify <command> [options]

Commands:
  bundle    Generate offline icon bundle
  analyze   Analyze icon usage in source code
  help      Show this help message
  version   Show version

Examples:
  npx rn-iconify bundle --auto --output ./assets/icons.json
  npx rn-iconify bundle --icons "mdi:home,mdi:settings"
  npx rn-iconify analyze --src ./src --format table
  npx rn-iconify analyze --detailed

Bundle Options:
  --src <path>       Source directory to analyze (default: ./src)
  --output <path>    Output file path (default: ./assets/icons.bundle.json)
  --auto             Auto-detect icons from source code (default: true)
  --icons <list>     Comma-separated list of icons to include
  --exclude <list>   Comma-separated patterns to exclude
  --verbose          Show detailed output
  --pretty           Pretty-print JSON output

Analyze Options:
  --src <path>       Source directory to analyze (default: ./src)
  --format <type>    Output format: table, json, markdown (default: table)
  --detailed         Show file locations for each icon
  --verbose          Show detailed output

More info: https://github.com/mogretici/rn-iconify
`;

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  command: string;
  options: Record<string, string | boolean | string[]>;
} {
  const command = args[0] || 'help';
  const options: Record<string, string | boolean | string[]> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      // Boolean flags
      if (
        !nextArg ||
        nextArg.startsWith('--') ||
        key === 'auto' ||
        key === 'verbose' ||
        key === 'pretty' ||
        key === 'detailed'
      ) {
        options[key] = true;
      } else {
        options[key] = nextArg;
        i++;
      }
    } else if (arg.startsWith('-')) {
      // Short flags
      const key = arg.slice(1);
      options[key] = true;
    }
  }

  return { command, options };
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  switch (command) {
    case 'bundle': {
      const bundleOptions: BundleOptions = {
        src: options.src as string,
        output: options.output as string,
        auto: options.auto !== false,
        icons: options.icons as string,
        exclude: options.exclude ? (options.exclude as string).split(',') : undefined,
        verbose: options.verbose as boolean,
        pretty: options.pretty as boolean,
      };

      const exitCode = await bundleCommand(bundleOptions);
      process.exit(exitCode);
      break;
    }

    case 'analyze': {
      const analyzeOptions: AnalyzeOptions = {
        src: options.src as string,
        format: options.format as 'table' | 'json' | 'markdown',
        detailed: options.detailed as boolean,
        verbose: options.verbose as boolean,
      };

      const exitCode = analyzeCommand(analyzeOptions);
      process.exit(exitCode);
      break;
    }

    case 'version':
    case '-v':
    case '--version':
      console.log(`rn-iconify v${VERSION}`);
      process.exit(EXIT_CODES.SUCCESS);
      break;

    case 'help':
    case '-h':
    case '--help':
    default:
      console.log(HELP);
      process.exit(command === 'help' ? EXIT_CODES.SUCCESS : EXIT_CODES.INVALID_ARGS);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(EXIT_CODES.ERROR);
});
