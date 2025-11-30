import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.css';

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
}

const stats: Stat[] = [
  { value: 268000, suffix: '+', label: 'Icons' },
  { value: 200, suffix: '+', label: 'Icon Sets' },
  { value: 30, suffix: 'x', label: 'Faster Cache' },
  { value: 50, suffix: 'KB', prefix: '~', label: 'Core Bundle' },
];

function useAnimatedCounter(end: number, duration = 2000, isVisible: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out-quart)
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(eased * end);

      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  return count;
}

function StatItem({ stat, isVisible }: { stat: Stat; isVisible: boolean }) {
  const animatedValue = useAnimatedCounter(stat.value, 2000, isVisible);

  return (
    <div className={styles.item}>
      <div className={styles.value}>
        {stat.prefix}
        {animatedValue.toLocaleString()}
        {stat.suffix}
      </div>
      <div className={styles.label}>{stat.label}</div>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.stats} ref={ref}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
