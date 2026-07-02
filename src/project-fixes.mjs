import { escapeRegExp } from './text-utils.mjs';

export function replaceMarkdownImageHref(markdown = '', fromHref = '', toHref = '') {
  if (!fromHref || !toHref || fromHref === toHref) return String(markdown || '');
  const matcher = new RegExp(`(!\\[[^\\]]*\\]\\()${escapeRegExp(fromHref)}(\\))`, 'g');
  return String(markdown || '').replace(matcher, `$1${toHref}$2`);
}
