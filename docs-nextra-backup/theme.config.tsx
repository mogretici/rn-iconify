import React from 'react';
import { DocsThemeConfig, useConfig } from 'nextra-theme-docs';
import { useRouter } from 'next/router';

const config: DocsThemeConfig = {
  logo: (
    <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>
      <span style={{ color: '#0070f3' }}>rn</span>-iconify
    </span>
  ),
  project: {
    link: 'https://github.com/mogretici/rn-iconify',
  },
  docsRepositoryBase: 'https://github.com/mogretici/rn-iconify/tree/main/docs',
  footer: {
    text: (
      <span>
        MIT {new Date().getFullYear()} ©{' '}
        <a href="https://github.com/mogretici/rn-iconify" target="_blank" rel="noreferrer">
          rn-iconify
        </a>
      </span>
    ),
  },
  head: function Head() {
    const { asPath, defaultLocale, locale } = useRouter();
    const { frontMatter, title } = useConfig();
    const url =
      'https://rn-iconify.vercel.app' + (defaultLocale === locale ? asPath : `/${locale}${asPath}`);

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title || 'rn-iconify'} />
        <meta
          property="og:description"
          content={
            frontMatter.description || '268,000+ icons for React Native with native MMKV caching'
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="268,000+ icons for React Native" />
        <link rel="icon" href="/favicon.ico" />
      </>
    );
  },
  primaryHue: 210,
  primarySaturation: 100,
  sidebar: {
    defaultMenuCollapseLevel: 2,
    toggleButton: true,
  },
  toc: {
    float: true,
    backToTop: true,
  },
  editLink: {
    text: 'Edit this page on GitHub →',
  },
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
  },
  navigation: {
    prev: true,
    next: true,
  },
  gitTimestamp: ({ timestamp }) => <span>Last updated on {timestamp.toLocaleDateString()}</span>,
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – rn-iconify',
      };
    }
    return {
      title: 'rn-iconify - 268,000+ Icons for React Native',
    };
  },
  banner: {
    key: 'v1-release',
    text: (
      <a href="https://github.com/mogretici/rn-iconify" target="_blank" rel="noreferrer">
        🎉 rn-iconify v1.0.0 is released!
      </a>
    ),
  },
};

export default config;
