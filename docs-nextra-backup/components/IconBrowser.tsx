'use client';

import { useState, useEffect, useCallback } from 'react';

interface IconSet {
  prefix: string;
  name: string;
  count: number;
}

// Convert prefix to component name (e.g., 'mdi' -> 'Mdi', 'fa6-solid' -> 'Fa6Solid')
function prefixToComponent(prefix: string): string {
  return prefix
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

interface IconData {
  name: string;
  prefix: string;
}

interface IconBrowserProps {
  showSearch?: boolean;
  showFilters?: boolean;
  maxIcons?: number;
}

export function IconBrowser({
  showSearch = true,
  showFilters = true,
  maxIcons = 100,
}: IconBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('all');
  const [icons, setIcons] = useState<IconData[]>([]);
  const [iconSets, setIconSets] = useState<IconSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null);

  // Fetch all icon sets from Iconify API on mount
  useEffect(() => {
    async function fetchIconSets() {
      try {
        const response = await fetch('https://api.iconify.design/collections');
        const data = await response.json();
        const sets: IconSet[] = Object.entries(data)
          .map(([prefix, info]: [string, any]) => ({
            prefix,
            name: info.name || prefix,
            count: info.total || 0,
          }))
          .sort((a, b) => b.count - a.count);
        setIconSets(sets);
      } catch (error) {
        console.error('Failed to fetch icon sets:', error);
      }
    }
    fetchIconSets();
  }, []);

  // Fetch icons from Iconify API
  const fetchIcons = useCallback(
    async (prefix: string, query: string) => {
      setLoading(true);
      try {
        const searchParam = query ? `&query=${encodeURIComponent(query)}` : '';
        const response = await fetch(
          `https://api.iconify.design/search?prefix=${prefix}${searchParam}&limit=${maxIcons}`
        );
        const data = await response.json();

        if (data.icons) {
          const iconList: IconData[] = data.icons.map((icon: string) => {
            const [iconPrefix, iconName] = icon.split(':');
            return { prefix: iconPrefix, name: iconName };
          });
          setIcons(iconList);
        }
      } catch (error) {
        console.error('Failed to fetch icons:', error);
        setIcons([]);
      }
      setLoading(false);
    },
    [maxIcons]
  );

  // Search across all sets or specific set
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (search.length >= 2) {
        const prefix = selectedSet === 'all' ? '' : selectedSet;
        fetchIcons(prefix, search);
      } else if (selectedSet !== 'all') {
        fetchIcons(selectedSet, '');
      } else {
        setIcons([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, selectedSet, fetchIcons]);

  // Copy icon usage to clipboard
  const copyToClipboard = useCallback(async (icon: IconData) => {
    const component = prefixToComponent(icon.prefix);
    const code = `<${component} name="${icon.name}" />`;

    try {
      await navigator.clipboard.writeText(code);
      setCopiedIcon(`${icon.prefix}:${icon.name}`);
      setTimeout(() => setCopiedIcon(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Get component name for display
  const getComponentName = useCallback((prefix: string) => {
    return prefixToComponent(prefix);
  }, []);

  return (
    <div className="icon-browser">
      {/* Search and Filters */}
      <div className="icon-browser-controls">
        {showSearch && (
          <input
            type="text"
            placeholder="Search icons... (min 2 characters)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="icon-search-input"
          />
        )}

        {showFilters && (
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="icon-set-select"
          >
            <option value="all">All Icon Sets ({iconSets.length})</option>
            {iconSets.map((set) => (
              <option key={set.prefix} value={set.prefix}>
                {set.name} ({set.count.toLocaleString('en-US')})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results Info */}
      <div className="icon-browser-info">
        {loading ? (
          <span>Loading icons...</span>
        ) : icons.length > 0 ? (
          <span>Found {icons.length} icons</span>
        ) : search.length >= 2 ? (
          <span>No icons found</span>
        ) : (
          <span>Enter at least 2 characters to search, or select an icon set</span>
        )}
      </div>

      {/* Icon Grid */}
      <div className="icon-grid">
        {icons.map((icon) => {
          const fullName = `${icon.prefix}:${icon.name}`;
          const isCopied = copiedIcon === fullName;

          return (
            <button
              key={fullName}
              className={`icon-card ${isCopied ? 'copied' : ''}`}
              onClick={() => copyToClipboard(icon)}
              title={`Click to copy: <${getComponentName(icon.prefix)} name="${icon.name}" />`}
            >
              <div className="icon-preview">
                <img
                  src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg`}
                  alt={icon.name}
                  width={32}
                  height={32}
                  loading="lazy"
                />
              </div>
              <div className="icon-info">
                <span className="icon-name">{icon.name}</span>
                <span className="icon-set">{icon.prefix}</span>
              </div>
              {isCopied && <span className="copied-badge">Copied!</span>}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .icon-browser {
          margin: 1.5rem 0;
        }

        .icon-browser-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .icon-search-input {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .icon-search-input:focus {
          border-color: #3b82f6;
        }

        :global(.dark) .icon-search-input {
          background: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }

        .icon-set-select {
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          cursor: pointer;
          min-width: 200px;
        }

        :global(.dark) .icon-set-select {
          background: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }

        .icon-browser-info {
          margin-bottom: 1rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .icon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .icon-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .icon-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .icon-card.copied {
          border-color: #10b981;
          background: #ecfdf5;
        }

        :global(.dark) .icon-card {
          background: #1f2937;
          border-color: #374151;
        }

        :global(.dark) .icon-card:hover {
          border-color: #3b82f6;
        }

        :global(.dark) .icon-card.copied {
          background: #064e3b;
          border-color: #10b981;
        }

        .icon-preview {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .icon-preview img {
          width: 32px;
          height: 32px;
        }

        :global(.dark) .icon-preview img {
          filter: invert(1);
        }

        .icon-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .icon-name {
          font-size: 0.75rem;
          color: #374151;
          word-break: break-word;
          max-width: 120px;
        }

        :global(.dark) .icon-name {
          color: #e5e7eb;
        }

        .icon-set {
          font-size: 0.625rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }

        .copied-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #10b981;
          color: white;
          font-size: 0.625rem;
          padding: 2px 6px;
          border-radius: 4px;
        }

        @media (max-width: 640px) {
          .icon-browser-controls {
            flex-direction: column;
          }

          .icon-search-input,
          .icon-set-select {
            width: 100%;
          }

          .icon-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

export function IconSetList() {
  const [iconSets, setIconSets] = useState<IconSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIconSets() {
      try {
        const response = await fetch('https://api.iconify.design/collections');
        const data = await response.json();
        const sets: IconSet[] = Object.entries(data)
          .map(([prefix, info]: [string, any]) => ({
            prefix,
            name: info.name || prefix,
            count: info.total || 0,
          }))
          .sort((a, b) => b.count - a.count);
        setIconSets(sets);
      } catch (error) {
        console.error('Failed to fetch icon sets:', error);
      }
      setLoading(false);
    }
    fetchIconSets();
  }, []);

  const totalIcons = iconSets.reduce((sum, set) => sum + set.count, 0);

  if (loading) {
    return <div className="icon-set-list">Loading icon sets...</div>;
  }

  return (
    <div className="icon-set-list">
      <p className="total-count">
        <strong>{iconSets.length}</strong> icon sets with{' '}
        <strong>{totalIcons.toLocaleString('en-US')}</strong>+ icons
      </p>

      <div className="icon-set-grid">
        {iconSets.map((set) => (
          <div key={set.prefix} className="icon-set-card">
            <div className="icon-set-header">
              <span className="icon-set-name">{set.name}</span>
              <span className="icon-set-count">{set.count.toLocaleString('en-US')}</span>
            </div>
            <div className="icon-set-details">
              <code className="icon-set-prefix">{set.prefix}</code>
              <code className="icon-set-component">&lt;{prefixToComponent(set.prefix)} /&gt;</code>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .icon-set-list {
          margin: 1.5rem 0;
        }

        .total-count {
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          color: #374151;
        }

        :global(.dark) .total-count {
          color: #e5e7eb;
        }

        .icon-set-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .icon-set-card {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
        }

        :global(.dark) .icon-set-card {
          background: #1f2937;
          border-color: #374151;
        }

        .icon-set-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .icon-set-name {
          font-weight: 600;
          color: #111827;
        }

        :global(.dark) .icon-set-name {
          color: #f9fafb;
        }

        .icon-set-count {
          font-size: 0.875rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        :global(.dark) .icon-set-count {
          background: #374151;
          color: #9ca3af;
        }

        .icon-set-details {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .icon-set-prefix,
        .icon-set-component {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: #f3f4f6;
          color: #374151;
        }

        :global(.dark) .icon-set-prefix,
        :global(.dark) .icon-set-component {
          background: #374151;
          color: #e5e7eb;
        }

        .icon-set-component {
          color: #3b82f6;
        }

        :global(.dark) .icon-set-component {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
}

export default IconBrowser;
