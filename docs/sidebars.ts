import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/typescript',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'features/placeholders',
        'features/theme-provider',
        'features/icon-aliases',
        'features/react-navigation',
        'features/animations',
        'features/accessibility',
        'features/performance-monitoring',
        'features/icon-explorer',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsed: false,
      items: [
        'advanced/babel-plugin',
        'advanced/cli-tools',
        'advanced/custom-server',
        'advanced/offline-bundles',
        'advanced/architecture',
        'advanced/cache-management',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api-reference/components',
        'api-reference/hooks',
        'api-reference/utilities',
        'api-reference/types',
      ],
    },
  ],
};

export default sidebars;
