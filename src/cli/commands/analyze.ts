/**
 * Analyze Command
 * Analyzes source code and reports icon usage statistics
 */

import type { AnalyzeOptions, AnalysisResult } from '../types';
import { EXIT_CODES } from '../types';
import { analyzeDirectory } from '../parser';

/**
 * Format bytes to human readable
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Estimate bundle size (rough estimate: ~400 bytes per icon average)
 */
function estimateBundleSize(iconCount: number): number {
  return iconCount * 400;
}

/**
 * Format result as table
 */
function formatTable(result: AnalysisResult, detailed: boolean): string {
  const lines: string[] = [];
  const divider = '─'.repeat(55);

  lines.push('');
  lines.push(`┌${divider}┐`);
  lines.push(`│ 📊 Icon Usage Report${' '.repeat(34)}│`);
  lines.push(`├${divider}┤`);

  const estimatedSize = formatSize(estimateBundleSize(result.totalIcons));
  lines.push(
    `│ Total icons: ${result.totalIcons.toString().padEnd(6)} │ Est. size: ${estimatedSize.padEnd(8)} │ Files: ${result.filesAnalyzed.toString().padEnd(4)}│`
  );

  lines.push(`├${divider}┤`);
  lines.push(
    `│ ${'Prefix'.padEnd(16)}│ ${'Count'.padEnd(7)}│ ${'Icons'.padEnd(7)}│ ${'% Total'.padEnd(10)}│`
  );
  lines.push(`├${divider}┤`);

  // Sort prefixes by count
  const sortedPrefixes = Object.entries(result.byPrefix).sort((a, b) => b[1].count - a[1].count);

  for (const [prefix, data] of sortedPrefixes) {
    const percent =
      result.totalUsage > 0 ? ((data.count / result.totalUsage) * 100).toFixed(1) : '0.0';

    lines.push(
      `│ ${prefix.padEnd(16)}│ ${data.count.toString().padEnd(7)}│ ${data.icons.length.toString().padEnd(7)}│ ${(percent + '%').padEnd(10)}│`
    );
  }

  lines.push(`└${divider}┘`);

  // Show top 10 most used icons
  if (result.icons.length > 0) {
    lines.push('');
    lines.push('🔥 Top 10 Most Used Icons:');

    const top10 = result.icons.slice(0, 10);
    for (let i = 0; i < top10.length; i++) {
      const icon = top10[i];
      lines.push(`   ${i + 1}. ${icon.icon} (${icon.count}x)`);
    }
  }

  // Show detailed locations if requested
  if (detailed && result.icons.length > 0) {
    lines.push('');
    lines.push('📍 All Icon Locations:');

    for (const icon of result.icons) {
      lines.push(`\n   ${icon.icon} (${icon.count}x):`);
      for (const loc of icon.locations.slice(0, 5)) {
        lines.push(`     - ${loc.file}:${loc.line}:${loc.column}`);
      }
      if (icon.locations.length > 5) {
        lines.push(`     ... and ${icon.locations.length - 5} more`);
      }
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Format result as JSON
 */
function formatJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Format result as Markdown
 */
function formatMarkdown(result: AnalysisResult, detailed: boolean): string {
  const lines: string[] = [];
  const estimatedSize = formatSize(estimateBundleSize(result.totalIcons));

  lines.push('# Icon Usage Report');
  lines.push('');
  lines.push(`- **Total Icons:** ${result.totalIcons}`);
  lines.push(`- **Total Usage:** ${result.totalUsage}`);
  lines.push(`- **Estimated Bundle Size:** ${estimatedSize}`);
  lines.push(`- **Files Analyzed:** ${result.filesAnalyzed}`);
  lines.push(`- **Generated:** ${result.timestamp}`);
  lines.push('');

  lines.push('## By Icon Set');
  lines.push('');
  lines.push('| Prefix | Usage Count | Unique Icons | % of Total |');
  lines.push('|--------|-------------|--------------|------------|');

  const sortedPrefixes = Object.entries(result.byPrefix).sort((a, b) => b[1].count - a[1].count);

  for (const [prefix, data] of sortedPrefixes) {
    const percent =
      result.totalUsage > 0 ? ((data.count / result.totalUsage) * 100).toFixed(1) : '0.0';

    lines.push(`| ${prefix} | ${data.count} | ${data.icons.length} | ${percent}% |`);
  }

  lines.push('');
  lines.push('## Top 10 Most Used');
  lines.push('');

  const top10 = result.icons.slice(0, 10);
  for (let i = 0; i < top10.length; i++) {
    const icon = top10[i];
    lines.push(`${i + 1}. \`${icon.icon}\` - ${icon.count} uses`);
  }

  if (detailed) {
    lines.push('');
    lines.push('## All Icons');
    lines.push('');
    lines.push('| Icon | Count | First Location |');
    lines.push('|------|-------|----------------|');

    for (const icon of result.icons) {
      const firstLoc = icon.locations[0];
      const location = firstLoc ? `${firstLoc.file}:${firstLoc.line}` : '-';
      lines.push(`| \`${icon.icon}\` | ${icon.count} | ${location} |`);
    }
  }

  return lines.join('\n');
}

/**
 * Analyze command implementation
 */
export function analyzeCommand(options: AnalyzeOptions): number {
  const { src = './src', format = 'table', detailed = false, verbose = false } = options;

  console.log('\n🔍 rn-iconify Analyzer\n');
  console.log(`   Analyzing: ${src}`);

  const result = analyzeDirectory(src, verbose);

  if (result.totalIcons === 0) {
    console.log('\n⚠️  No icons found in the source code.\n');
    console.log("   Make sure you're using rn-iconify components like:");
    console.log('   <Mdi name="home" /> or prefetchIcons([\'mdi:home\'])\n');
    return EXIT_CODES.SUCCESS;
  }

  let output: string;

  switch (format) {
    case 'json':
      output = formatJSON(result);
      break;
    case 'markdown':
      output = formatMarkdown(result, detailed);
      break;
    case 'table':
    default:
      output = formatTable(result, detailed);
      break;
  }

  console.log(output);

  return EXIT_CODES.SUCCESS;
}
