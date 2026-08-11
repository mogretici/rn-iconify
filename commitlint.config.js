/**
 * Commitlint Configuration
 * Enforces conventional commit messages
 *
 * Format: <type>(<scope>): <subject>
 *
 * Types:
 * - feat: New feature
 * - fix: Bug fix
 * - docs: Documentation changes
 * - style: Code style changes (formatting, etc.)
 * - refactor: Code refactoring
 * - perf: Performance improvements
 * - test: Adding or updating tests
 * - build: Build system changes
 * - ci: CI/CD changes
 * - chore: Maintenance tasks
 * - revert: Reverting changes
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 250],
    'subject-max-length': [2, 'always', 250],
    'body-max-line-length': [2, 'always', 250],
    /*
     * Off, not raised.
     *
     * The commits this has to accept include the one semantic-release writes
     * for a release, whose footer is the changelog: a bullet per change, each
     * carrying a markdown link to the PR and another to the commit. Two URLs
     * and a subject already pass 100 characters, and there is no length that
     * is safe — the subject is written by whoever opened the pull request.
     *
     * A release was blocked by exactly this: the version was computed, the
     * changelog written, and the commit then rejected by our own hook for
     * being too long to describe what it had just done. Nothing about a
     * footer's length is worth failing a release over.
     */
    'footer-max-line-length': [0],
  },
};
