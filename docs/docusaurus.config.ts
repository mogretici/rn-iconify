import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'rn-iconify',
  titleDelimiter: '·',
  tagline:
    '268,000+ icons for React Native with native MMKV caching and full TypeScript autocomplete',
  favicon: 'img/favicon.svg',

  url: 'https://rn-iconify.vercel.app',
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

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content:
          'react-native, icons, iconify, svg, typescript, mmkv, material-design, heroicons, lucide, phosphor, tabler, fontawesome',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'mogretici',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:title',
        content: 'rn-iconify - 268,000+ Icons for React Native',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:description',
        content:
          'Native MMKV caching, full TypeScript autocomplete, 200+ icon sets. Built for performance.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'rn-iconify',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://rn-iconify.vercel.app',
      },
    },
  ],

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
          filename: 'sitemap.xml',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    image: 'img/social-card.jpg',

    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    announcementBar: {
      id: 'v2-release',
      content:
        '🎉 rn-iconify v2.0.0 is released! Theme, Animations, Navigation helpers and more. <a href="/docs/getting-started/installation">Get started</a>',
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
