import { execFileSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

const [before, after] = process.argv.slice(2);
if (![before, after].every((sha) => /^[0-9a-f]{40}$/.test(sha))) {
  throw new Error('Usage: node database-report.mjs <previous commit SHA> <current commit SHA>');
}

function readJson(sha, file, fallback = null) {
  const path = `lib/source/${file}`;
  if (fallback !== null && !execFileSync('git', ['ls-tree', sha, '--', path], { encoding: 'utf8' })) {
    return fallback;
  }
  return JSON.parse(execFileSync('git', ['show', `${sha}:${path}`], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }));
}

function inline(value) {
  if (value == null) return '—';
  const text = String(value).replace(/[\r\n]+/g, ' ');
  const ticks = '`'.repeat(1 + Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length)));
  return `${ticks} ${text} ${ticks}`;
}

function themeMap(themes) {
  // Themes absent from Crowdin share the placeholder ID -1.
  return new Map(themes.map((theme) => [
    theme.id == null || String(theme.id) === '-1' ? `name:${theme.theme}` : `id:${theme.id}`,
    theme,
  ]));
}

function describeMultiwords(previous, current) {
  const oldWords = new Map(previous.map((word) => [word.multiword, word]));
  const newWords = new Map(current.map((word) => [word.multiword, word]));
  const changes = [];

  for (const [word, value] of newWords) {
    if (!oldWords.has(word)) changes.push(`added ${inline(word)}`);
    else if (!isDeepStrictEqual(value, oldWords.get(word))) {
      changes.push(`changed occurrences for ${inline(word)}`);
    }
  }
  for (const word of oldWords.keys()) {
    if (!newWords.has(word)) changes.push(`removed ${inline(word)}`);
  }

  if (changes.length === 0) return 'order changed';
  const details = changes.slice(0, 12).join(', ');
  return changes.length > 12 ? `${details}, and ${changes.length - 12} more` : details;
}

function addSection(report, title, entries) {
  if (entries.length === 0) return;
  report.push(`### ${title}`, '', ...entries.slice(0, 25), '');
  if (entries.length > 25) report.push(`_Showing 25 of ${entries.length} entries._`, '');
}

const previousVersion = readJson(before, 'versions.json').last_updated;
const currentVersion = readJson(after, 'versions.json').last_updated;
const oldThemes = themeMap(readJson(before, 'translations-data.json'));
const newThemes = themeMap(readJson(after, 'translations-data.json'));
const oldStats = readJson(before, 'stats-translations.json', {});
const newStats = readJson(after, 'stats-translations.json', {});
const themeKeys = new Set([...oldThemes.keys(), ...newThemes.keys()]);
const themeChanges = [];
const shortcuts = [];
const multiwords = [];
const byLanguage = new Map();

for (const key of themeKeys) {
  const previous = oldThemes.get(key);
  const current = newThemes.get(key);
  const name = inline((current ?? previous).theme);

  if (!previous) themeChanges.push(`- Added ${name}`);
  else if (!current) themeChanges.push(`- Removed ${name}`);
  else if (previous.theme !== current.theme) {
    themeChanges.push(`- Renamed ${inline(previous.theme)} → ${name}`);
  }

  if ((previous?.shortcut ?? null) !== (current?.shortcut ?? null)) {
    shortcuts.push(`- ${name} ${inline(previous?.shortcut)} → ${inline(current?.shortcut)}`);
  }

  const oldMultiwords = previous?.multiwords ?? [];
  const newMultiwords = current?.multiwords ?? [];
  if (!isDeepStrictEqual(oldMultiwords, newMultiwords)) {
    multiwords.push(`- ${name} · ${describeMultiwords(oldMultiwords, newMultiwords)}`);
  }

  const oldTranslations = previous?.translations ?? {};
  const newTranslations = current?.translations ?? {};
  for (const language of new Set([...Object.keys(oldTranslations), ...Object.keys(newTranslations)])) {
    const oldEntry = oldTranslations[language];
    const newEntry = newTranslations[language];
    if (isDeepStrictEqual(oldEntry, newEntry)) continue;

    const counts = byLanguage.get(language) ?? { added: 0, removed: 0, text: 0, approval: 0, dates: 0 };
    if (!oldEntry) counts.added++;
    else if (!newEntry) counts.removed++;
    else {
      counts.text += (oldEntry.translation ?? null) !== (newEntry.translation ?? null);
      counts.approval += (oldEntry.is_approved ?? false) !== (newEntry.is_approved ?? false);
      counts.dates += (oldEntry.approved_at ?? null) !== (newEntry.approved_at ?? null);
    }
    byLanguage.set(language, counts);
  }
}

const report = ['## Database Changes Report', ''];
const version = previousVersion === currentVersion
  ? inline(currentVersion)
  : `${inline(previousVersion)} → ${inline(currentVersion)}`;
report.push(`**Snapshot date** ${version}`, '');
if (before === after) report.push('_No translation update was needed._', '');

addSection(report, `Themes (${themeChanges.length})`, themeChanges);
addSection(report, `Shortcut changes (${shortcuts.length} themes)`, shortcuts);
addSection(report, `Multiword changes (${multiwords.length} themes)`, multiwords);

const statsChanges = [];
for (const key of new Set([...Object.keys(oldStats), ...Object.keys(newStats)])) {
  if (!Object.hasOwn(oldStats, key)) statsChanges.push(`- Added ${inline(key)}`);
  else if (!Object.hasOwn(newStats, key)) statsChanges.push(`- Removed ${inline(key)}`);
  else if (!isDeepStrictEqual(oldStats[key], newStats[key])) statsChanges.push(`- Updated ${inline(key)}`);
}
addSection(report, `Stats strings (${statsChanges.length} changed)`, statsChanges);

const languages = [...byLanguage].filter(([, counts]) => Object.values(counts).some(Boolean));
if (languages.length > 0) {
  report.push('### Translation changes by language', '',
    '| Language | Added | Removed | Text changed | Approval changed | Approval date changed |',
    '| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const [language, counts] of languages.sort(([a], [b]) => a.localeCompare(b))) {
    report.push(`| ${inline(language.replaceAll('|', '\\|'))} | ${counts.added} | ${counts.removed} | ${counts.text} | ${counts.approval} | ${counts.dates} |`);
  }
  report.push('');
}

if (before !== after && !themeChanges.length && !shortcuts.length && !multiwords.length && !languages.length && !statsChanges.length) {
  report.push('_No theme or stats string changes were detected._', '');
}

console.log(report.join('\n'));
