import React from 'react';
import styles from './styles.module.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    icon: '📦',
    title: '200+ Icon Sets',
    description: 'Material Design, Heroicons, Lucide, Phosphor, and more',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  },
  {
    icon: '🔷',
    title: 'TypeScript',
    description: 'Full autocomplete for 268,000+ icons',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    icon: '⚡',
    title: 'MMKV Cache',
    description: '30x faster than AsyncStorage',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
  {
    icon: '🔧',
    title: 'Babel Plugin',
    description: 'Bundle icons at build time for 0ms first render',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  {
    icon: '🎨',
    title: 'Theme Provider',
    description: 'Global styling with React Context',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
  {
    icon: '✨',
    title: 'Animations',
    description: 'spin, pulse, bounce, shake, ping, wiggle',
    gradient: 'linear-gradient(135deg, #ec4899, #f59e0b)',
  },
  {
    icon: '🧭',
    title: 'Navigation Ready',
    description: 'Tab bars, drawers, headers out of the box',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  {
    icon: '♿',
    title: 'Accessibility',
    description: 'Screen reader support with semantic labels',
    gradient: 'linear-gradient(135deg, #14b8a6, #10b981)',
  },
  {
    icon: '📴',
    title: 'Offline Bundles',
    description: 'Pre-bundle icons for offline-first apps',
    gradient: 'linear-gradient(135deg, #64748b, #475569)',
  },
  {
    icon: '🏷️',
    title: 'Icon Aliases',
    description: 'Create semantic names for your icons',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className={styles.card} key={index}>
      <div className={styles.iconWrapper} style={{ background: feature.gradient }}>
        <span className={styles.icon}>{feature.icon}</span>
      </div>
      <h3 className={styles.cardTitle}>{feature.title}</h3>
      <p className={styles.cardDescription}>{feature.description}</p>
    </div>
  );
}

export function Features() {
  // Create array of cards for seamless loop
  const allCards = [...features, ...features, ...features];

  return (
    <section className={styles.features}>
      <div className={styles.marqueeContainer}>
        <div className={styles.marqueeTrack}>
          {allCards.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
