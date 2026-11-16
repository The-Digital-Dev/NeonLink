// The "every platform" showcase: the sample profile with every built-in platform switched on.
// Used by the static demos (dist/demo/<theme>/all-platforms/), the platform grid image and
// docs/platforms.md. All links point at example.com, and the phone number is a fictional 555 one.
import { PLATFORMS } from '../app/platforms.mjs';
import { composeEnvironment } from '../tests/helpers.mjs';

export function showcaseEnv(base = composeEnvironment(new URL('../compose.yaml', import.meta.url))) {
  const env = { ...base };
  // Only the sample identity is kept; its own link variables are replaced by the full set.
  for (const k of Object.keys(env)) if (/^(CUSTOM_BUTTON_|LINK_\d+_|PRIMARY_BUTTONS|BUTTON_ORDER|FEATURED_)/.test(k) || PLATFORMS.some((p) => k === p.key || k.startsWith(`${p.key}_`))) delete env[k];
  for (const p of PLATFORMS) {
    if (env[p.key]) continue;
    env[p.key] = p.scheme === 'mailto' ? `${p.name === 'default' ? (p.key === 'EMAIL' ? 'hello' : 'press') : p.name}@example.com`
      : p.scheme === 'tel' || p.scheme === 'sms' ? '+1 555 0100'
      : `https://example.com/${p.name}`;
  }
  // Custom links in every style: borrowed platform logo with accent, emoji, monogram, dark accent.
  Object.assign(env, {
    LINK_1_NAME: 'SHOP', LINK_1_URL: 'https://example.com/shop', LINK_1_TEXT: 'Visit my shop', LINK_1_NOTE: 'Custom link · borrowed Etsy logo', LINK_1_ICON: 'etsy', LINK_1_COLOR: '#F1641E',
    LINK_2_NAME: 'TALKS', LINK_2_URL: 'https://example.com/talks', LINK_2_TEXT: 'Conference talks', LINK_2_NOTE: 'Custom link · emoji icon', LINK_2_ICON: '🎤', LINK_2_COLOR: '#B48CFF',
    LINK_3_NAME: 'NEWSLETTER', LINK_3_URL: 'https://example.com/newsletter', LINK_3_TEXT: 'Monthly notes', LINK_3_NOTE: 'Custom link · monogram, no icon', LINK_3_COLOR: '#3DFF8F',
    LINK_4_NAME: 'ARCHIVE', LINK_4_URL: 'https://example.com/archive', LINK_4_TEXT: 'Project archive', LINK_4_NOTE: 'Custom link · dark accent, kept readable', LINK_4_COLOR: '#1A1A2E',
  });
  env.PRIMARY_BUTTONS = 'WEBSITE,SHOP,TALKS,NEWSLETTER,ARCHIVE,EMAIL,CALENDLY';
  env.FEATURED_BUTTON = 'WEBSITE';
  env.FEATURED_TEXT = 'Every platform NeonLink supports';
  env.FEATURED_LABEL = `Showcase // ${PLATFORMS.length} platforms`;
  env.META_INDEX_STATUS = 'noindex,follow';
  return env;
}

// One entry per platform for documentation: variable, label, icon file and link scheme.
export const platformRows = () =>
  PLATFORMS.map((p) => ({ key: p.key, label: p.label, icon: p.icon, scheme: p.scheme || 'https' }));
