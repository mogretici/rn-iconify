'use client';

const stats = [
  { value: '268K+', label: 'Icons' },
  { value: '200+', label: 'Icon Sets' },
  { value: '30x', label: 'Faster Cache' },
  { value: '~50KB', label: 'Core Bundle' },
];

export function Stats() {
  return (
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat-item">
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          margin: 1rem 0 2.5rem;
          padding: 1.5rem 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
        :global(.dark) .stats-grid {
          border-color: #374151;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        :global(.dark) .stat-value {
          color: #f9fafb;
        }
        .stat-label {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        :global(.dark) .stat-label {
          color: #9ca3af;
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
