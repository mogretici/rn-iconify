'use client';

const features = [
  { title: '200+ Icon Sets', desc: 'Material Design, Heroicons, Lucide, Phosphor, and more' },
  { title: 'TypeScript', desc: 'Full autocomplete for 268K+ icons' },
  { title: 'MMKV Cache', desc: '30x faster than AsyncStorage' },
  { title: 'Babel Plugin', desc: 'Bundle icons at build time' },
  { title: 'Theme Provider', desc: 'Global styling with React Context' },
  { title: 'Animations', desc: 'spin, pulse, bounce, shake, ping, wiggle' },
];

export function Features() {
  return (
    <div className="features">
      <div className="features-grid">
        {features.map((f) => (
          <div key={f.title} className="feature">
            <span className="feature-title">{f.title}</span>
            <span className="feature-desc">{f.desc}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .features {
          margin: 1.5rem 0 2.5rem;
          padding: 1.5rem 0;
        }
        :global(.dark) .features {
          border-color: #374151;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem 2rem;
        }
        .feature {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .feature-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
        }
        :global(.dark) .feature-title {
          color: #f9fafb;
        }
        .feature-desc {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.4;
        }
        :global(.dark) .feature-desc {
          color: #9ca3af;
        }
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
