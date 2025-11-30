import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './styles.module.css';

interface IconSet {
  prefix: string;
  name: string;
  count: number;
  category?: string;
}

interface IconResult {
  prefix: string;
  name: string;
}

type CopyFormat = 'component' | 'name' | 'import' | 'alias';

const POPULAR_SETS = [
  { prefix: 'mdi', name: 'Material Design', emoji: '🎨' },
  { prefix: 'heroicons', name: 'Heroicons', emoji: '⚡' },
  { prefix: 'lucide', name: 'Lucide', emoji: '✨' },
  { prefix: 'ph', name: 'Phosphor', emoji: '🔮' },
  { prefix: 'tabler', name: 'Tabler', emoji: '📐' },
  { prefix: 'ri', name: 'Remix', emoji: '🎯' },
];

const SIZE_PRESETS = [16, 20, 24, 32, 40, 48];
const ICONS_PER_PAGE = 120;

// Default sets to show when browsing all icons
const BROWSE_SETS = [
  'mdi',
  'heroicons',
  'lucide',
  'ph',
  'tabler',
  'ri',
  'fa6-solid',
  'bi',
  'carbon',
  'fluent',
];

function prefixToComponent(prefix: string): string {
  return prefix
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function generateCode(icon: IconResult, format: CopyFormat, color: string, size: number): string {
  const componentName = prefixToComponent(icon.prefix);
  const fullName = `${icon.prefix}:${icon.name}`;

  switch (format) {
    case 'component':
      const colorProp = color !== '#6b7280' ? ` color="${color}"` : '';
      return `<${componentName} name="${icon.name}" size={${size}}${colorProp} />`;
    case 'name':
      return fullName;
    case 'import':
      return `import { ${componentName} } from 'rn-iconify/icons/${icon.prefix}';\n\n<${componentName} name="${icon.name}" size={${size}} />`;
    case 'alias':
      return `${icon.name.replace(/-/g, '_')}: '${fullName}',`;
    default:
      return fullName;
  }
}

export function IconBrowser() {
  const [search, setSearch] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [icons, setIcons] = useState<IconResult[]>([]);
  const [iconSets, setIconSets] = useState<IconSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [previewColor, setPreviewColor] = useState('#6b7280');
  const [previewSize, setPreviewSize] = useState(32);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [selectedIcon, setSelectedIcon] = useState<IconResult | null>(null);
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('component');
  const [hasMore, setHasMore] = useState(true);
  const [browseIndex, setBrowseIndex] = useState(0);
  const [collectionIcons, setCollectionIcons] = useState<string[]>([]);
  const [collectionOffset, setCollectionOffset] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 2500);
  }, []);

  // Fetch icon sets on mount
  useEffect(() => {
    fetch('https://api.iconify.design/collections')
      .then((res) => res.json())
      .then((data) => {
        const sets: IconSet[] = Object.entries(data)
          .map(([prefix, info]: [string, unknown]) => {
            const iconInfo = info as { name?: string; total?: number; category?: string };
            return {
              prefix,
              name: iconInfo.name || prefix,
              count: iconInfo.total || 0,
              category: iconInfo.category,
            };
          })
          .sort((a, b) => b.count - a.count);
        setIconSets(sets);
      })
      .catch(console.error);
  }, []);

  // Fetch collection icons for browsing
  const fetchCollectionIcons = useCallback(async (prefix: string): Promise<string[]> => {
    try {
      const res = await fetch(`https://api.iconify.design/collection?prefix=${prefix}`);
      const data = await res.json();

      if (data.uncategorized) {
        return data.uncategorized;
      }

      // If icons are categorized, flatten all categories
      if (data.categories) {
        const allIcons: string[] = [];
        Object.values(data.categories).forEach((categoryIcons: unknown) => {
          if (Array.isArray(categoryIcons)) {
            allIcons.push(...categoryIcons);
          }
        });
        return allIcons;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      return [];
    }
  }, []);

  // Load initial icons (browse mode)
  const loadBrowseIcons = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const initialIcons: IconResult[] = [];

      // Load icons from multiple popular sets
      for (const prefix of BROWSE_SETS.slice(0, 4)) {
        const iconNames = await fetchCollectionIcons(prefix);
        const shuffled = iconNames.sort(() => Math.random() - 0.5).slice(0, 50);
        shuffled.forEach((name) => {
          initialIcons.push({ prefix, name });
        });
      }

      // Shuffle the combined results
      const shuffled = initialIcons.sort(() => Math.random() - 0.5);
      setIcons(shuffled.slice(0, ICONS_PER_PAGE));
      setBrowseIndex(4);
      setHasMore(true);
    } catch (error) {
      console.error('Failed to load browse icons:', error);
    }

    setLoading(false);
    loadingRef.current = false;
  }, [fetchCollectionIcons]);

  // Load more icons for browsing
  const loadMoreBrowseIcons = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMore(true);

    try {
      const newIcons: IconResult[] = [];
      const nextSets = BROWSE_SETS.slice(browseIndex, browseIndex + 2);

      if (nextSets.length === 0) {
        // Reload from beginning with different random selection
        for (const prefix of BROWSE_SETS.slice(0, 3)) {
          const iconNames = await fetchCollectionIcons(prefix);
          const shuffled = iconNames.sort(() => Math.random() - 0.5).slice(0, 40);
          shuffled.forEach((name) => {
            newIcons.push({ prefix, name });
          });
        }
        setBrowseIndex(3);
      } else {
        for (const prefix of nextSets) {
          const iconNames = await fetchCollectionIcons(prefix);
          const shuffled = iconNames.sort(() => Math.random() - 0.5).slice(0, 60);
          shuffled.forEach((name) => {
            newIcons.push({ prefix, name });
          });
        }
        setBrowseIndex((prev) => prev + 2);
      }

      const shuffled = newIcons.sort(() => Math.random() - 0.5);
      setIcons((prev) => [...prev, ...shuffled]);
    } catch (error) {
      console.error('Failed to load more icons:', error);
    }

    setLoadingMore(false);
    loadingRef.current = false;
  }, [browseIndex, hasMore, fetchCollectionIcons]);

  // Load icons from selected collection
  const loadCollectionIcons = useCallback(
    async (prefix: string, offset: number = 0) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      if (offset === 0) {
        setLoading(true);
        const iconNames = await fetchCollectionIcons(prefix);
        setCollectionIcons(iconNames);

        const pageIcons = iconNames.slice(0, ICONS_PER_PAGE).map((name) => ({ prefix, name }));
        setIcons(pageIcons);
        setCollectionOffset(ICONS_PER_PAGE);
        setHasMore(iconNames.length > ICONS_PER_PAGE);
        setLoading(false);
      } else {
        setLoadingMore(true);
        const pageIcons = collectionIcons
          .slice(offset, offset + ICONS_PER_PAGE)
          .map((name) => ({ prefix, name }));
        setIcons((prev) => [...prev, ...pageIcons]);
        setCollectionOffset(offset + ICONS_PER_PAGE);
        setHasMore(collectionIcons.length > offset + ICONS_PER_PAGE);
        setLoadingMore(false);
      }

      loadingRef.current = false;
    },
    [fetchCollectionIcons, collectionIcons]
  );

  // Search icons
  const searchIcons = useCallback(async () => {
    if (search.length < 2) return;

    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const prefix = selectedSet || '';
      const url = `https://api.iconify.design/search?prefix=${prefix}&query=${encodeURIComponent(search)}&limit=200`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.icons) {
        const iconList: IconResult[] = data.icons.map((icon: string) => {
          const [iconPrefix, iconName] = icon.split(':');
          return { prefix: iconPrefix, name: iconName };
        });
        setIcons(iconList);
        setHasMore(false); // Search results don't have pagination
      } else {
        setIcons([]);
      }
    } catch (error) {
      console.error('Failed to fetch icons:', error);
      setIcons([]);
    }

    setLoading(false);
    loadingRef.current = false;
  }, [search, selectedSet]);

  // Handle search/browse mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        // Search mode
        searchIcons();
      } else if (selectedSet) {
        // Browse specific collection
        loadCollectionIcons(selectedSet, 0);
      } else {
        // Browse all mode
        loadBrowseIcons();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, selectedSet, searchIcons, loadCollectionIcons, loadBrowseIcons]);

  // Infinite scroll handler
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = grid;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

      if (isNearBottom) {
        if (search.length >= 2) {
          // No pagination for search
          return;
        } else if (selectedSet) {
          // Load more from collection
          loadCollectionIcons(selectedSet, collectionOffset);
        } else {
          // Load more browse icons
          loadMoreBrowseIcons();
        }
      }
    };

    grid.addEventListener('scroll', handleScroll);
    return () => grid.removeEventListener('scroll', handleScroll);
  }, [search, selectedSet, hasMore, collectionOffset, loadCollectionIcons, loadMoreBrowseIcons]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target === document.body) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedIcon(null);
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyToClipboard = useCallback(
    async (icon: IconResult, format: CopyFormat = copyFormat) => {
      const code = generateCode(icon, format, previewColor, previewSize);
      try {
        await navigator.clipboard.writeText(code);
        showToast(
          `Copied ${format === 'name' ? 'icon name' : format === 'alias' ? 'alias' : 'code'}!`
        );
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    },
    [copyFormat, previewColor, previewSize, showToast]
  );

  const handleQuickFilter = (prefix: string) => {
    if (selectedSet === prefix) {
      setSelectedSet('');
    } else {
      setSelectedSet(prefix);
      setSearch('');
    }
  };

  const handleSetChange = (prefix: string) => {
    setSelectedSet(prefix);
    setSearch('');
    setIcons([]);
    setCollectionIcons([]);
    setCollectionOffset(0);
    setBrowseIndex(0);
    setHasMore(true);
  };

  const selectedSetInfo = iconSets.find((s) => s.prefix === selectedSet);
  const totalIconsInSet = selectedSetInfo?.count || 0;
  const totalAllIcons = iconSets.reduce((sum, set) => sum + set.count, 0);

  return (
    <div className={styles.browser}>
      {/* Toast Notification */}
      <div className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}>
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
        {toast.message}
      </div>

      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.searchWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={searchRef}
            className={styles.search}
            placeholder="Search icons or browse below..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className={styles.kbd}>/</kbd>
        </div>
        <select
          className={styles.select}
          value={selectedSet}
          onChange={(e) => handleSetChange(e.target.value)}
        >
          <option value="">All Icon Sets ({iconSets.length})</option>
          {iconSets.map((set) => (
            <option key={set.prefix} value={set.prefix}>
              {set.name} ({set.count.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Filter Chips */}
      <div className={styles.chips}>
        <span className={styles.chipsLabel}>Popular:</span>
        <button
          className={`${styles.chip} ${!selectedSet ? styles.chipActive : ''}`}
          onClick={() => handleQuickFilter('')}
        >
          <span className={styles.chipEmoji}>🌐</span>
          All
        </button>
        {POPULAR_SETS.map((set) => (
          <button
            key={set.prefix}
            className={`${styles.chip} ${selectedSet === set.prefix ? styles.chipActive : ''}`}
            onClick={() => handleQuickFilter(set.prefix)}
          >
            <span className={styles.chipEmoji}>{set.emoji}</span>
            {set.name}
          </button>
        ))}
      </div>

      {/* Controls Row */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Preview Color</label>
          <div className={styles.colorPicker}>
            <input
              type="color"
              value={previewColor}
              onChange={(e) => setPreviewColor(e.target.value)}
              className={styles.colorInput}
            />
            <input
              type="text"
              value={previewColor}
              onChange={(e) => setPreviewColor(e.target.value)}
              className={styles.colorText}
              maxLength={7}
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Size: {previewSize}px</label>
          <div className={styles.sizeButtons}>
            {SIZE_PRESETS.map((size) => (
              <button
                key={size}
                className={`${styles.sizeBtn} ${previewSize === size ? styles.sizeBtnActive : ''}`}
                onClick={() => setPreviewSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Copy Format</label>
          <select
            className={styles.formatSelect}
            value={copyFormat}
            onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
          >
            <option value="component">Component JSX</option>
            <option value="name">Icon Name</option>
            <option value="import">Full Import</option>
            <option value="alias">Alias Definition</option>
          </select>
        </div>
      </div>

      {/* Info Bar */}
      <div className={styles.info}>
        {loading ? (
          <span className={styles.loadingText}>
            <span className={styles.spinner} />
            Loading icons...
          </span>
        ) : icons.length > 0 ? (
          <span className={styles.resultCount}>
            {search.length >= 2 ? (
              <>
                <strong>{icons.length.toLocaleString()}</strong> icons matching "{search}"
              </>
            ) : selectedSet ? (
              <>
                <strong>{totalIconsInSet.toLocaleString()}</strong> icons in {selectedSetInfo?.name}
              </>
            ) : (
              <>
                <strong>{totalAllIcons > 0 ? totalAllIcons.toLocaleString() : '200,000+'}</strong>{' '}
                icons from {iconSets.length} sets
              </>
            )}
            <span className={styles.hint}> — Click to copy, double-click for details</span>
          </span>
        ) : search.length >= 2 ? (
          <span className={styles.noResults}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            No icons found. Try different keywords.
          </span>
        ) : (
          <span className={styles.hint}>Browse icons below or search for specific ones</span>
        )}
      </div>

      {/* Icon Grid */}
      <div ref={gridRef} className={styles.grid}>
        {icons.map((icon, index) => {
          const iconKey = `${icon.prefix}:${icon.name}-${index}`;
          const isSelected =
            selectedIcon?.prefix === icon.prefix && selectedIcon?.name === icon.name;

          return (
            <div
              key={iconKey}
              className={`${styles.iconCard} ${isSelected ? styles.iconCardSelected : ''}`}
              onClick={() => copyToClipboard(icon)}
              onDoubleClick={() => setSelectedIcon(icon)}
            >
              <div className={styles.iconPreviewWrapper}>
                <img
                  src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg?color=${encodeURIComponent(previewColor)}`}
                  alt={icon.name}
                  className={styles.iconPreview}
                  style={{ width: previewSize, height: previewSize }}
                  loading="lazy"
                />
              </div>
              <span className={styles.iconName}>{icon.name}</span>
              <span className={styles.iconPrefix}>{icon.prefix}</span>
            </div>
          );
        })}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className={styles.loadingMore}>
            <span className={styles.spinner} />
            <span>Loading more...</span>
          </div>
        )}
      </div>

      {/* Scroll hint */}
      {hasMore && icons.length > 0 && !loading && !loadingMore && (
        <div className={styles.scrollHint}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <span>Scroll for more icons</span>
        </div>
      )}

      {/* Detail Modal */}
      {selectedIcon && (
        <div className={styles.modalOverlay} onClick={() => setSelectedIcon(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedIcon(null)}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className={styles.modalPreview}>
              <img
                src={`https://api.iconify.design/${selectedIcon.prefix}/${selectedIcon.name}.svg?color=${encodeURIComponent(previewColor)}`}
                alt={selectedIcon.name}
                style={{ width: 80, height: 80 }}
              />
            </div>

            <h3 className={styles.modalTitle}>{selectedIcon.name}</h3>
            <p className={styles.modalSubtitle}>{selectedIcon.prefix}</p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalBtn}
                onClick={() => copyToClipboard(selectedIcon, 'component')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Component
              </button>
              <button
                className={styles.modalBtn}
                onClick={() => copyToClipboard(selectedIcon, 'name')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
                Copy Name
              </button>
              <button
                className={styles.modalBtn}
                onClick={() => copyToClipboard(selectedIcon, 'import')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Copy Import
              </button>
              <button
                className={styles.modalBtn}
                onClick={() => copyToClipboard(selectedIcon, 'alias')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                Copy Alias
              </button>
            </div>

            <div className={styles.modalCode}>
              <div className={styles.codeHeader}>
                <span>Usage Example</span>
              </div>
              <pre className={styles.codeBlock}>
                <code>{generateCode(selectedIcon, 'import', previewColor, previewSize)}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IconBrowser;
