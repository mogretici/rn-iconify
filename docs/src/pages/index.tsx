import React from 'react';
import Layout from '@theme/Layout';
import { Hero } from '@site/src/components/Hero';
import { Features } from '@site/src/components/Features';
import styles from './index.module.css';

export default function Home(): React.ReactElement {
  return (
    <Layout
      title=""
      description="rn-iconify - Native MMKV caching, TypeScript autocomplete, 200+ icon sets for React Native"
    >
      <main className={styles.main}>
        <Hero />
        <Features />
      </main>
    </Layout>
  );
}
