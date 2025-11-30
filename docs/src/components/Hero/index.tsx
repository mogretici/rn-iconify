import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export function Hero() {
  const [copied, setCopied] = useState(false);
  const installCommand = 'npm install rn-iconify react-native-svg react-native-mmkv';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.gradientOrb} />
      <div className={styles.gradientOrb2} />

      <div className={styles.container}>
        <h1 className={styles.title}>
          <span className={styles.gradientText}>rn-iconify</span>
        </h1>

        <p className={styles.subtitle}>Everything you need for icons</p>
        <p className={styles.description}>
          Built for performance, designed for developers. Native MMKV caching, full TypeScript
          autocomplete, and seamless integration with React Navigation.
        </p>

        <div className={styles.installCommand} onClick={handleCopy}>
          <span className={styles.commandPrefix}>$</span>
          <code className={styles.commandText}>{installCommand}</code>
          <button className={styles.copyButton} title="Copy to clipboard">
            {copied ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} to="/docs/getting-started/installation">
            Get Started
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link className={styles.secondaryButton} to="/icon-sets">
            Browse Icons
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
