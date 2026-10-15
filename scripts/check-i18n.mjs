import { readFile, readdir } from 'node:fs/promises';
import ts from 'typescript';
const locales = await Promise.all(['en', 'fa-AF'].map(async locale => JSON.parse(await readFile(`src/i18n/locales/${locale}.json`, 'utf8'))));
const errors = [];
for (const key of new Set(locales.flatMap(locale => Object.keys(locale)))) {
  for (let i = 0; i < locales.length; i++) if (typeof locales[i][key] !== 'string' || !locales[i][key].trim()) errors.push(`${['en', 'fa-AF'][i]}: missing ${key}`);
  if (locales.every(locale => locale[key])) {
    for (let i = 0; i < locales.length; i++) if (/\?{2,}|\uFFFD/.test(locales[i][key])) errors.push(`Invalid text encoding in ${['en', 'fa-AF'][i]}: ${key}`);
    const variables = text => [...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort().join(',');
    if (variables(locales[0][key]) !== variables(locales[1][key])) errors.push(`Interpolation mismatch: ${key}`);
  }
}
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { await scan(path); continue; }
    if (!/\.tsx?$/.test(path) || /\.test\.|\/test\//.test(path)) continue;
    const code = await readFile(path, 'utf8'); const file = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const report = (node, message) => errors.push(`${path}:${file.getLineAndCharacterOfPosition(node.getStart()).line + 1}: ${message}`);
    function visit(node) {
      if (ts.isCallExpression(node) && ((ts.isIdentifier(node.expression) && node.expression.text === 't') || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 't')) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && !(node.arguments[0].text in locales[0])) report(node, `Unknown translation key ${node.arguments[0].text}`);
      if (ts.isJsxText(node) && /[\p{L}]/u.test(node.text)) report(node, `Untranslated JSX text: ${node.text.trim()}`);
      if (ts.isJsxAttribute(node) && ['placeholder', 'aria-label', 'title', 'alt'].includes(node.name.getText(file)) && node.initializer && ts.isStringLiteral(node.initializer) && /\p{L}/u.test(node.initializer.text)) report(node, `Untranslated ${node.name.getText(file)}`);
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
}
await scan('src');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Translation check passed: ${Object.keys(locales[0]).length} keys in exactly two locales; interpolation and JSX static checks passed.`);
