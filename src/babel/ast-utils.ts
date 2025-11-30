/**
 * AST Utilities
 * Helper functions for working with Babel AST nodes
 */

import type * as BabelTypes from '@babel/types';
import type { NodePath } from '@babel/core';

/**
 * Get the component name from a JSX opening element
 * Handles: <Mdi />, <Heroicons />, etc.
 */
export function getComponentName(
  node: BabelTypes.JSXOpeningElement,
  t: typeof BabelTypes
): string | null {
  const { name } = node;

  // Simple identifier: <Mdi />
  if (t.isJSXIdentifier(name)) {
    return name.name;
  }

  // Member expression: <Icons.Mdi /> - not supported for now
  if (t.isJSXMemberExpression(name)) {
    return null;
  }

  return null;
}

/**
 * Get the value of the 'name' attribute from a JSX element
 * Handles: name="home", name='home'
 * Returns null for dynamic values: name={iconName}
 */
export function getNameAttribute(
  node: BabelTypes.JSXOpeningElement,
  t: typeof BabelTypes
): string | null {
  for (const attr of node.attributes) {
    // Skip spread attributes: {...props}
    if (t.isJSXSpreadAttribute(attr)) {
      continue;
    }

    // Check if it's the 'name' attribute
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'name' })) {
      const { value } = attr;

      // String literal: name="home"
      if (t.isStringLiteral(value)) {
        return value.value;
      }

      // JSX expression container: name={"home"} or name={'home'}
      if (t.isJSXExpressionContainer(value)) {
        const { expression } = value;

        // String literal inside expression: name={"home"}
        if (t.isStringLiteral(expression)) {
          return expression.value;
        }

        // Template literal without expressions: name={`home`}
        if (t.isTemplateLiteral(expression) && expression.expressions.length === 0) {
          return expression.quasis[0]?.value.raw || null;
        }

        // Dynamic value - return null
        return null;
      }

      return null;
    }
  }

  return null;
}

/**
 * Check if a call expression is calling a specific function by name
 * Handles: prefetchIcons([...])
 */
export function isCallTo(
  path: NodePath<BabelTypes.CallExpression>,
  functionName: string,
  t: typeof BabelTypes
): boolean {
  const { callee } = path.node;

  // Direct function call: prefetchIcons()
  if (t.isIdentifier(callee) && callee.name === functionName) {
    return true;
  }

  // Member expression not supported: something.prefetchIcons()
  return false;
}

/**
 * Extract string values from an array expression
 * Handles: ['mdi:home', 'mdi:settings']
 * Skips dynamic values
 */
export function extractArrayStrings(
  node: BabelTypes.Node | null | undefined,
  t: typeof BabelTypes
): string[] {
  if (!node || !t.isArrayExpression(node)) {
    return [];
  }

  const strings: string[] = [];

  for (const element of node.elements) {
    if (!element) continue;

    // String literal
    if (t.isStringLiteral(element)) {
      strings.push(element.value);
    }

    // Template literal without expressions
    if (t.isTemplateLiteral(element) && element.expressions.length === 0) {
      const value = element.quasis[0]?.value.raw;
      if (value) {
        strings.push(value);
      }
    }
  }

  return strings;
}

/**
 * Get location info from a node
 */
export function getNodeLocation(node: BabelTypes.Node): { line: number; column: number } {
  return {
    line: node.loc?.start.line ?? 0,
    column: node.loc?.start.column ?? 0,
  };
}

/**
 * Check if an icon name matches a pattern (supports wildcards)
 * @example matchesPattern('mdi:home', 'mdi:*') => true
 * @example matchesPattern('mdi:home', 'mdi:home') => true
 * @example matchesPattern('mdi:home', 'heroicons:*') => false
 */
export function matchesPattern(iconName: string, pattern: string): boolean {
  // Exact match
  if (pattern === iconName) {
    return true;
  }

  // Wildcard pattern
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2);
    return iconName.startsWith(prefix + ':');
  }

  // Glob-style pattern with * in the middle
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(iconName);
  }

  return false;
}

/**
 * Check if an icon should be included based on include/exclude patterns
 */
export function shouldIncludeIcon(
  iconName: string,
  include?: string[],
  exclude?: string[]
): boolean {
  // Check exclude first
  if (exclude?.some((pattern) => matchesPattern(iconName, pattern))) {
    return false;
  }

  // If no include patterns, include everything not excluded
  if (!include || include.length === 0) {
    return true;
  }

  // Check if matches any include pattern
  return include.some((pattern) => matchesPattern(iconName, pattern));
}

/**
 * Validate icon name format
 * Valid format: prefix:name (e.g., mdi:home)
 */
export function isValidIconName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const parts = name.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [prefix, iconName] = parts;

  // Both parts must be non-empty
  if (!prefix || !iconName) {
    return false;
  }

  // Basic validation: alphanumeric and hyphens
  const validPattern = /^[a-z0-9-]+$/i;
  return validPattern.test(prefix) && validPattern.test(iconName);
}
