'use client';

export function Hero() {
  return (
    <div className="hero">
      <h1 className="hero-title">
        <span className="gradient-text">rn-iconify</span>
      </h1>
      <p className="hero-subtitle">268,000+ icons for React Native</p>
      <p className="hero-description">
        Native MMKV caching • TypeScript autocomplete • 200+ icon sets
      </p>
      <div className="hero-buttons">
        <a href="/docs/getting-started/installation" className="btn-primary">
          Get Started
        </a>
        <a href="/icon-sets" className="btn-secondary">
          Browse Icons
        </a>
      </div>
      <style jsx>{`
        .hero {
          text-align: center;
          padding: 3rem 0 2.5rem;
          margin-bottom: 1rem;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 1rem;
          letter-spacing: -0.03em;
        }
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 1.5rem;
          color: #374151;
          margin: 0 0 0.5rem;
          font-weight: 500;
        }
        :global(.dark) .hero-subtitle {
          color: #e5e7eb;
        }
        .hero-description {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 2rem;
        }
        :global(.dark) .hero-description {
          color: #9ca3af;
        }
        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          padding: 0.75rem 1.75rem;
          border-radius: 10px;
          font-weight: 600;
          text-decoration: none;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          font-size: 0.95rem;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.35);
        }
        .btn-secondary {
          background: transparent;
          color: #374151;
          padding: 0.75rem 1.75rem;
          border-radius: 10px;
          font-weight: 600;
          text-decoration: none;
          border: 2px solid #e5e7eb;
          transition:
            border-color 0.2s,
            color 0.2s;
          font-size: 0.95rem;
        }
        :global(.dark) .btn-secondary {
          color: #e5e7eb;
          border-color: #374151;
        }
        .btn-secondary:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }
        @media (max-width: 640px) {
          .hero {
            padding: 2rem 0 1.5rem;
          }
          .hero-title {
            font-size: 2.5rem;
          }
          .hero-subtitle {
            font-size: 1.2rem;
          }
          .hero-description {
            font-size: 0.9rem;
          }
          .btn-primary,
          .btn-secondary {
            padding: 0.65rem 1.25rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
