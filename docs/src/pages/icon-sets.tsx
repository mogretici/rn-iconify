import React from 'react';
import Layout from '@theme/Layout';
import { IconBrowser } from '@site/src/components/IconBrowser';
import styles from './icon-sets.module.css';

export default function IconSets(): React.ReactElement {
  return (
    <Layout
      title="Icon Browser"
      description="Browse 268,000+ icons from 200+ icon sets including Material Design, Heroicons, Lucide, Phosphor, and more"
    >
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Icon Browser</h1>
            <p className={styles.description}>
              Search and browse 268,000+ icons from 200+ icon sets. Click any icon to copy the
              component code.
            </p>
          </div>
          <IconBrowser />
        </div>
      </main>
    </Layout>
  );
}
