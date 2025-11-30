'use client';

import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="page-wrapper">
      {children}
      <style jsx>{`
        .page-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        @media (max-width: 768px) {
          .page-wrapper {
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  );
}
