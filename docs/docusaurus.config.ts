import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'rn-iconify | Icons for React Native',
  titleDelimiter: '·',
  tagline: '268,000+ icons for React Native',
  favicon: 'img/favicon.svg',

  url: 'https://mogretici.github.io',
  baseUrl: '/',

  organizationName: 'mogretici',
  projectName: 'rn-iconify',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  future: {
    v4: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/mogretici/rn-iconify/tree/main/docs/',
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
          sidebarCollapsed: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly' as const,
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    image: 'img/social-card.png',

    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    announcementBar: {
      id: 'v1-release',
      content:
        '🎉 rn-iconify v1.0.0 is released! Check out the <a href="/docs/getting-started/installation">documentation</a>',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      isCloseable: true,
    },

    navbar: {
      title: 'rn-iconify',
      logo: {
        alt: 'rn-iconify Logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/api-reference/components',
          label: 'API Reference',
          position: 'left',
        },
        {
          to: '/icon-sets',
          label: 'Icon Browser',
          position: 'left',
        },
        {
          href: 'https://www.npmjs.com/package/rn-iconify',
          position: 'right',
          className: 'header-npm-link',
          'aria-label': 'npm package',
        },
        {
          href: 'https://github.com/mogretici/rn-iconify',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'tsx'],
    },

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },

    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
