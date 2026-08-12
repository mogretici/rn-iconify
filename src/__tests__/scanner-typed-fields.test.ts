import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { scanProjectForIcons } from '../babel/scanner';

/**
 * A name does not have to be written on `<Ion>` to be certain at build time.
 *
 * These three shapes are how applications actually write a table of icons, all
 * of them typed, and none of them were found: the scan read JSX attributes,
 * `defineIcons` calls and wrapper props, and stopped there. Every icon in a
 * table like this was fetched from the Iconify API on first render — correct
 * code paying the price of the scan not following it.
 *
 * Measured on one application: 30 of its 54 unresolved icons were these.
 */
describe('icons in a field the file has typed', () => {
  let projectRoot: string;

  const write = (relative: string, contents: string) => {
    const full = path.join(projectRoot, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-fields-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('reads an interface field and the table that fills it', () => {
    write(
      'tabs.ts',
      `
      import type { IonIconName } from 'rn-iconify';

      interface TabConfig {
        icon: IonIconName;
        route: string;
      }

      export const TABS: TabConfig[] = [
        { icon: 'home', route: 'Home' },
        { icon: 'search', route: 'Search' },
      ];
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:home');
    expect(icons).toContain('ion:search');
  });

  it('reads a field typed inline rather than through an interface', () => {
    write(
      'ProfileTabs.tsx',
      `
      import type { IonIconName } from 'rn-iconify';

      const tabs: { key: string; icon: IonIconName; activeIcon: IonIconName }[] = [
        { key: 'outfits', icon: 'grid-outline', activeIcon: 'grid' },
      ];
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:grid-outline');
    expect(icons).toContain('ion:grid');
  });

  /**
   * `ComponentProps<typeof Ion>['name']` is the same type as `IonIconName`,
   * written the way someone reaches for when they want the type of a prop.
   * The field it annotates named no set, so every icon in the table below it
   * was fetched at runtime.
   */
  it('follows a name the file gives the type itself', () => {
    write(
      'types.ts',
      `
      import { Ion } from 'rn-iconify';
      import type { ComponentProps } from 'react';

      type IoniconName = ComponentProps<typeof Ion>['name'];

      export const BADGE_CONFIG: Record<string, { name: IoniconName; color: string }> = {
        LIKE: { name: 'heart', color: '#f00' },
        FOLLOW: { name: 'person-add', color: '#00f' },
      };
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:heart');
    expect(icons).toContain('ion:person-add');
  });

  /**
   * The same type, written onto the field instead of into an alias. There is
   * no name to look up, so the annotation itself has to be read — and this is
   * how a wrapper component usually declares the prop.
   */
  it('follows the type written straight onto the field', () => {
    write(
      'ShareOverlay.tsx',
      `
      import { Ion } from 'rn-iconify';
      import type { ComponentProps } from 'react';

      interface ShareOptionProps {
        icon: ComponentProps<typeof Ion>['name'];
        label: string;
      }

      function ShareOption({ icon }: ShareOptionProps) {
        return <Ion name={icon} />;
      }

      export const ShareOverlay = () => (
        <>
          <ShareOption icon="logo-whatsapp" label="WhatsApp" />
          <ShareOption icon="logo-instagram" label="Instagram" />
        </>
      );
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:logo-whatsapp');
    expect(icons).toContain('ion:logo-instagram');
  });

  it('follows the same alias written through the React namespace', () => {
    write(
      'types.ts',
      `
      import { Mdi } from 'rn-iconify';

      type BadgeIcon = React.ComponentProps<typeof Mdi>['name'];

      export const ICONS: Record<string, BadgeIcon> = { WIN: 'trophy' };
      `
    );

    expect(scanProjectForIcons(projectRoot)).toContain('mdi:trophy');
  });

  /**
   * A table whose values are all icons names no field at all — the type is on
   * the record. This is the shape the untyped `Record<string, string>` map
   * becomes once it is written correctly, so failing to read it would have
   * punished exactly the fix this scan asks for.
   */
  it('reads a record whose values are the icons', () => {
    write(
      'badges.ts',
      `
      import type { MdiIconName } from 'rn-iconify';

      export const CATEGORY_ICON: Record<string, MdiIconName> = {
        OUTFIT: 'hanger',
        SPOTLIGHT: 'theater',
      };
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('mdi:hanger');
    expect(icons).toContain('mdi:theater');
  });

  it('reads a readonly record the same way', () => {
    write(
      'badges.ts',
      `
      import type { IonIconName } from 'rn-iconify';

      export const ICONS: Readonly<Record<string, IonIconName>> = { HOME: 'home' };
      `
    );

    expect(scanProjectForIcons(projectRoot)).toContain('ion:home');
  });

  /**
   * `name={paused ? 'play' : 'pause'}` is how a component says an icon depends
   * on state. Both names are literals in the source and both are certain, but
   * only the first quoted string was read — so an icon that toggles was
   * fetched over the network the first time it toggled.
   */
  it('reads both names out of a conditional', () => {
    write(
      'Player.tsx',
      `
      import { Ion } from 'rn-iconify';

      export const Player = ({ paused }: { paused: boolean }) => (
        <Ion name={paused ? 'play' : 'pause'} size={20} />
      );
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:play');
    expect(icons).toContain('ion:pause');
  });

  it('reads a conditional handed to a wrapper', () => {
    write(
      'IconButton.tsx',
      `
      import { Ion } from 'rn-iconify';
      import type { IonIconName } from 'rn-iconify';

      export function IconButton({ icon }: { icon: IonIconName }) {
        return <Ion name={icon} />;
      }
      `
    );
    write(
      'Bar.tsx',
      `
      import { IconButton } from './IconButton';

      export const Bar = ({ muted }: { muted: boolean }) => (
        <IconButton icon={muted ? 'volume-mute' : 'volume-high'} />
      );
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:volume-mute');
    expect(icons).toContain('ion:volume-high');
  });

  it('ignores a variable in the expression rather than guessing', () => {
    write(
      'Player.tsx',
      `
      import { Ion } from 'rn-iconify';

      export const Player = ({ icon }: { icon: string }) => <Ion name={icon} />;
      `
    );

    expect(scanProjectForIcons(projectRoot)).toEqual([]);
  });

  // The field is only an icon where the file said so. Reading every
  // `something: 'value'` in a project would bundle half of Iconify.
  it('leaves a field alone when nothing typed it', () => {
    write(
      'config.ts',
      `
      export const CONFIG: Record<string, string> = {
        icon: 'home',
        route: 'Home',
      };
      `
    );

    expect(scanProjectForIcons(projectRoot)).toEqual([]);
  });

  it('does not take a value that is not an icon in that set', () => {
    write(
      'tabs.ts',
      `
      import type { IonIconName } from 'rn-iconify';

      interface Tab { icon: IonIconName; label: string }

      export const TABS: Tab[] = [{ icon: 'home', label: 'definitely-not-an-icon' }];
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:home');
    expect(icons).not.toContain('ion:definitely-not-an-icon');
  });

  it('keeps each set to its own field', () => {
    write(
      'mixed.ts',
      `
      import type { IonIconName, MdiIconName } from 'rn-iconify';

      interface Row { leading: IonIconName; trailing: MdiIconName }

      export const ROWS: Row[] = [{ leading: 'home', trailing: 'trophy' }];
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:home');
    expect(icons).toContain('mdi:trophy');
    expect(icons).not.toContain('mdi:home');
  });
});

/**
 * This package ships `createIconAliases` and recommends it as the way to keep
 * icon choices in one place. Its own scan did not read it, so an application
 * following that recommendation paid a network fetch on first render for every
 * alias it declared — one had 62.
 */
describe('icons in a createIconAliases registry', () => {
  let projectRoot: string;

  const write = (relative: string, contents: string) => {
    const full = path.join(projectRoot, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  };

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-alias-'));
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('reads the names a registry declares', () => {
    write(
      'icons.ts',
      `
      import { createIconAliases } from 'rn-iconify';

      export const { Icon } = createIconAliases({
        aliases: {
          back: 'ion:chevron-back',
          settings: 'mdi:cog',
        },
      });
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toContain('ion:chevron-back');
    expect(icons).toContain('mdi:cog');
  });

  it('reads a registry written with a type argument', () => {
    write(
      'icons.ts',
      `
      import { createIconAliases } from 'rn-iconify';

      export const { Icon } = createIconAliases<{ home: 'ion:home' }>({
        aliases: { home: 'ion:home' },
      });
      `
    );

    expect(scanProjectForIcons(projectRoot)).toContain('ion:home');
  });

  // The config holds more than aliases, and none of the rest is an icon.
  it('leaves the rest of the config alone', () => {
    write(
      'icons.ts',
      `
      import { createIconAliases } from 'rn-iconify';

      export const { Icon } = createIconAliases({
        aliases: { back: 'ion:chevron-back' },
        fallback: 'some:nonsense-that-is-not-an-icon',
      });
      `
    );

    const icons = scanProjectForIcons(projectRoot);

    expect(icons).toEqual(['ion:chevron-back']);
  });
});
