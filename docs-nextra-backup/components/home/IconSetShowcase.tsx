'use client';

const iconSets = ['Mdi', 'Ph', 'Tabler', 'Heroicons', 'Lucide', 'Fa6Solid', 'Ion', 'Ri'];

export function IconSetShowcase() {
  return (
    <div className="showcase">
      <div className="sets">
        {iconSets.map((name, i) => (
          <span key={name}>
            <code className="set-name">{`<${name} />`}</code>
            {i < iconSets.length - 1 && <span className="separator">&nbsp;&nbsp;</span>}
          </span>
        ))}
      </div>
      <a href="/icon-sets" className="browse-link">
        Browse all 200+ icon sets
      </a>
      <style jsx>{`
        .showcase {
          margin: 1.5rem 0 2rem;
          text-align: center;
        }
        .sets {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem 0;
          margin-bottom: 1rem;
        }
        .set-name {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.9rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
        }
        :global(.dark) .set-name {
          color: #9ca3af;
          background: #374151;
        }
        .separator {
          color: #d1d5db;
        }
        :global(.dark) .separator {
          color: #4b5563;
        }
        .browse-link {
          display: inline-block;
          color: #3b82f6;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
        }
        .browse-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
