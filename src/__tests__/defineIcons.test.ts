import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { defineIcons } from '../babel/defineIcons';
import { scanProjectForIcons } from '../babel/scanner';

/**
 * Some icon names cannot be inferred from source, and no scanner will change
 * that. A lookup table typed `Record<string, string>` says nothing about which
 * set its values belong to; a name assembled at runtime says nothing at all.
 *
 * Left alone those are fetched from the Iconify API on every install. This is
 * where an application says what the source could not, and the type argument
 * makes it checked rather than merely declared.
 */
describe('defineIcons', () => {
  it('gives back exactly what it was given', () => {
    const icons = { OUTFIT: 'hanger', SPOTLIGHT: 'theater' } as const;

    expect(defineIcons(icons)).toBe(icons);
  });

  it('accepts a list as readily as a map', () => {
    const icons = ['hanger', 'theater'] as const;

    expect(defineIcons(icons)).toBe(icons);
  });

  describe('as read by the build', () => {
    let projectRoot: string;

    const write = (relative: string, contents: string) => {
      const full = path.join(projectRoot, relative);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, contents);
    };

    beforeEach(() => {
      projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-iconify-define-'));
    });

    afterEach(() => {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    it('bundles the names of a declared map', () => {
      write(
        'icons.ts',
        `
        import { defineIcons } from 'rn-iconify';
        import type { MdiIconName } from 'rn-iconify';
        export const CATEGORY_ICON = defineIcons<MdiIconName>({
          OUTFIT: 'hanger',
          SPOTLIGHT: 'theater',
        });
        `
      );

      const icons = scanProjectForIcons(projectRoot);

      expect(icons).toContain('mdi:hanger');
      expect(icons).toContain('mdi:theater');
    });

    it('takes the set from the type argument', () => {
      write(
        'icons.ts',
        `
        import { defineIcons } from 'rn-iconify';
        import type { IonIconName } from 'rn-iconify';
        export const SHARE_ICON = defineIcons<IonIconName>({ WHATSAPP: 'logo-whatsapp' });
        `
      );

      const icons = scanProjectForIcons(projectRoot);

      expect(icons).toContain('ion:logo-whatsapp');
      expect(icons).not.toContain('mdi:logo-whatsapp');
    });

    it('reads a declared list', () => {
      write(
        'icons.ts',
        `
        import { defineIcons } from 'rn-iconify';
        import type { IonIconName } from 'rn-iconify';
        export const EXTRA = defineIcons<IonIconName>(['sunny-outline', 'leaf-outline']);
        `
      );

      const icons = scanProjectForIcons(projectRoot);

      expect(icons).toContain('ion:sunny-outline');
      expect(icons).toContain('ion:leaf-outline');
    });

    // A declaration is as likely to hold nested shapes as flat ones, and the
    // closing brace is found by counting rather than by the next one seen.
    it('reads names out of a nested declaration', () => {
      write(
        'icons.ts',
        `
        import { defineIcons } from 'rn-iconify';
        import type { IonIconName } from 'rn-iconify';
        export const BY_STATE = defineIcons<IonIconName>({
          idle: 'ellipse-outline',
          busy: 'sync-outline',
        });
        export const OTHER = { unrelated: { deep: 'not-an-icon-here' } };
        `
      );

      const icons = scanProjectForIcons(projectRoot);

      expect(icons).toContain('ion:ellipse-outline');
      expect(icons).toContain('ion:sync-outline');
      expect(icons).not.toContain('ion:not-an-icon-here');
    });

    it('ignores a declaration whose type is not an icon set', () => {
      write(
        'icons.ts',
        `
        import { defineIcons } from 'rn-iconify';
        export const NOPE = defineIcons<SomethingElseIconName>({ a: 'home' });
        `
      );

      expect(scanProjectForIcons(projectRoot)).not.toContain('home');
    });
  });
});
