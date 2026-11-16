// Theme registry. To add a theme: create themes/<name>/theme.mjs exporting meta (name, title, themeColor,
// optional wording defaults), page(config, parts), favicon(sigil) and avatar(initials); put its static
// files in themes/<name>/public/ (served at /theme/); import it here.
import * as neon from './neon/theme.mjs';
import * as neural from './neural/theme.mjs';
import * as openingBell from './opening-bell/theme.mjs';

export const THEMES = Object.freeze({ neon, neural, 'opening-bell': openingBell });
export const DEFAULT_THEME = 'neon';
// littlelink-server used THEME for its light/dark switch; those values select the default theme quietly.
export const LEGACY_THEME_VALUES = Object.freeze(['dark', 'light', 'auto']);
