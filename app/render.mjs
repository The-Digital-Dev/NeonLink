// Renders the page with the configured theme. Themes share one content model (config.mjs).
import { THEMES, DEFAULT_THEME } from './themes/index.mjs';
import { parts } from './html.mjs';

export { esc, EARLY_SCRIPT, EARLY_SCRIPT_HASH } from './html.mjs';

export const themeOf = (c) => THEMES[c.theme] || THEMES[DEFAULT_THEME];

export function render(c, v = 'dev') {
  const theme = themeOf(c);
  return theme.page(c, parts(c, v, theme.meta.themeColor));
}

export const favicon = (c) => themeOf(c).favicon(c.sigil);

// Generated avatar (initials from NAME, or SIGIL) used when no picture is configured.
export const placeholder = (c) => themeOf(c).avatar(c.sigil);
