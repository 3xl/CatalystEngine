// Palette for the Phaser scenes, derived from VitePress CSS variables
// so the demos automatically follow the site's light/dark theme.

export interface DemoPalette {
  bg: number;
  surface: number;
  text: number;
  textSoft: number;
  brand: number;
  brandSoft: number;
  success: number;
  warning: number;
  danger: number;
  // "#rrggbb" string versions handy for DOM/text styles
  css: {
    text: string;
    textSoft: string;
    brand: string;
  };
}

/** True if the user prefers reduced motion (accessibility). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Converts a CSS color string (`#rgb`, `#rrggbb`, `rgb(...)`) to 0xRRGGBB. */
function cssColorToHex(value: string, fallback: number): number {
  const v = value.trim();
  if (!v) return fallback;

  // #rgb or #rrggbb
  if (v[0] === '#') {
    let hex = v.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    const n = parseInt(hex, 16);
    return Number.isNaN(n) ? fallback : n;
  }

  // rgb(...) / rgba(...)
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((s) => parseInt(s, 10));
    if ([r, g, b].some(Number.isNaN)) return fallback;
    return (r << 16) | (g << 8) | b;
  }

  return fallback;
}

function readVar(styles: CSSStyleDeclaration, name: string, fallback: number): number {
  return cssColorToHex(styles.getPropertyValue(name), fallback);
}

/**
 * Reads the current palette from VitePress's `:root`.
 * To be called when the scene is created (client-side).
 */
export function readPalette(): DemoPalette {
  const styles = getComputedStyle(document.documentElement);

  const bg = readVar(styles, '--vp-c-bg', 0xffffff);
  const surface = readVar(styles, '--vp-c-bg-soft', 0xf6f6f7);
  const text = readVar(styles, '--vp-c-text-1', 0x213547);
  const textSoft = readVar(styles, '--vp-c-text-2', 0x67676c);
  const brand = readVar(styles, '--vp-c-brand-1', 0x3451b2);
  const brandSoft = readVar(styles, '--vp-c-brand-soft', 0xb8c0e0);
  const success = readVar(styles, '--vp-c-green-1', 0x18794e);
  const warning = readVar(styles, '--vp-c-yellow-1', 0x915930);
  const danger = readVar(styles, '--vp-c-red-1', 0xb8272c);

  const toCss = (n: number) => '#' + n.toString(16).padStart(6, '0');

  return {
    bg,
    surface,
    text,
    textSoft,
    brand,
    brandSoft,
    success,
    warning,
    danger,
    css: {
      text: toCss(text),
      textSoft: toCss(textSoft),
      brand: toCss(brand),
    },
  };
}
