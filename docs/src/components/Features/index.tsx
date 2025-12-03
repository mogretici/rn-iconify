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
    description: '268,000+ icons from Material, Heroicons, Lucide, Phosphor & more',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
  },
  {
    icon: '💫',
    title: 'Loading States',
    description: 'Skeleton, pulse & shimmer placeholders',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
  },
  {
    icon: '⚡',
    title: '30x Faster Cache',
    description: 'Native MMKV caching beats AsyncStorage',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  },
  {
    icon: '📏',
    title: '~50KB Core',
    description: 'Lightweight bundle, icons loaded on demand',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
  },
  {
    icon: '🔷',
    title: 'TypeScript',
    description: 'Full autocomplete for all icons',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    icon: '🔧',
    title: 'Babel Plugin',
    description: 'Bundle icons at build time for 0ms first render',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  {
    icon: '🎭',
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
  {
    icon: '🔍',
    title: 'Icon Explorer',
    description: 'Browse & search icons in dev mode',
    gradient: 'linear-gradient(135deg, #a855f7, #6366f1)',
  },
  {
    icon: '📊',
    title: 'Performance Monitor',
    description: 'Track load times & cache hit rates',
    gradient: 'linear-gradient(135deg, #f97316, #eab308)',
  },
  {
    icon: '🚀',
    title: 'Prefetch Icons',
    description: "Preload icons before they're needed",
    gradient: 'linear-gradient(135deg, #22d3ee, #818cf8)',
  },
  {
    icon: '⚙️',
    title: 'CLI Tools',
    description: 'Analyze usage & generate bundles',
    gradient: 'linear-gradient(135deg, #78716c, #a8a29e)',
  },
  {
    icon: '🔌',
    title: 'TurboModule',
    description: 'Native JSI for zero-overhead caching',
    gradient: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  },
  {
    icon: '📡',
    title: 'Batch Fetching',
    description: 'Multiple icons in a single request',
    gradient: 'linear-gradient(135deg, #84cc16, #22c55e)',
  },
  {
    icon: '🔄',
    title: 'Request Deduplication',
    description: 'Prevents duplicate concurrent requests',
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
  },
  {
    icon: '🌐',
    title: 'Custom Icon Server',
    description: 'Self-host your own Iconify API',
    gradient: 'linear-gradient(135deg, #7c3aed, #c026d3)',
  },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className={styles.card} key={index}>
      <div className={styles.iconWrapper} style={{ background: feature.gradient }}>
        <span className={styles.icon}>{feature.icon}</span>
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{feature.title}</h3>
        <p className={styles.cardDescription}>{feature.description}</p>
      </div>
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
