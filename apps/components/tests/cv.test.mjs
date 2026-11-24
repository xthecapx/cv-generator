import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToCv, cvToMarkdown, validateCvMarkdown, pdfFontSize, contactUrl, CvDocument, splitCjkWord, cjkHyphenation } from '../dist/index.es.js';

const markdown = `---
font-size: 15
favorite: false
year: 2026
tags:
  - cv
---
# 王明 Jane Wang
  - title: 软件工程师
  - phone: +86 123456789
  - email: jane@example.com
  - location: 上海
  - Website: https://example.com/path?q=one: two
  - Languages: 中文: 母语; English: fluent
  - GitHub: https://github.com/jane
  - Portfolio: [My work](https://example.com/work)
  - Missing separator
  - Empty:
## 工作经历
### 软件工程师 | 2024–2026
#### 示例公司 | 上海
- Built software for users in China.
## 简介
这是一个中文段落。
`;

test('preserves custom contact fields, Chinese text, colons and indented bullets', () => {
  const cv = markdownToCv(markdown);
  assert.equal(cv.contact.location, '上海');
  assert.equal(cv.contact.email, 'jane@example.com');
  assert.deepEqual(cv.contact.details, [
    { label: 'Website', value: 'https://example.com/path?q=one: two' },
    { label: 'Languages', value: '中文: 母语; English: fluent' },
    { label: 'Portfolio', value: '[My work](https://example.com/work)' },
  ]);
  assert.equal(cv.contact.links[0].url, 'https://github.com/jane');
  assert.equal(validateCvMarkdown(markdown).isValid, true);
});

test('export/import round trip keeps custom fields, typed YAML, and paragraphs', () => {
  const cv = markdownToCv(markdown.replace(/\n/g, '\r\n'));
  const exported = markdownToCv(cvToMarkdown(cv));
  assert.deepEqual(exported, cv);
  assert.equal(exported.properties['font-size'], 15);
  assert.equal(exported.properties.favorite, false);
  assert.equal(exported.sections[1].items[0].plain, true);
});

test('safe link handling preserves protocols and only expands known bare domains', () => {
  assert.equal(contactUrl('https://github.com/jane', true), 'https://github.com/jane');
  assert.equal(contactUrl('github.com/jane', true), 'https://github.com/jane');
  assert.equal(contactUrl('mailto:jane@example.com'), 'mailto:jane@example.com');
  assert.equal(contactUrl('https://example.com:8080'), 'https://example.com:8080');
  assert.equal(contactUrl('javascript:alert(1)', true), undefined);
  assert.equal(contactUrl('Software engineer'), undefined);
});

test('font sizes accept numeric properties and fall back for invalid input', () => {
  for (const size of [8, 12, 20, '14']) assert.equal(pdfFontSize(size), Number(size));
  for (const size of [0, 21, -1, '', null, Infinity, true, 'big']) assert.equal(pdfFontSize(size, 13), 13);
});

test('Chinese line breaks preserve characters and punctuation without splitting English words', () => {
  const text = '中文，English文字（测试）。';
  const pieces = splitCjkWord(text);
  assert.equal(pieces.join(''), text);
  assert.ok(pieces.includes('English'));
  assert.ok(pieces.includes('（测'));
  assert.ok(pieces.includes('试）。'));
  assert.ok(pieces.includes(''));
  assert.equal(cjkHyphenation('English only'), undefined);
});

test('note font-size overrides the plugin default and old CV objects still render', () => {
  const cv = markdownToCv(markdown);
  const document = CvDocument({ cvData: cv, options: { fontSize: 10 } });
  assert.equal(document.props.children.props.style[1].fontSize, 15);
  delete cv.contact.details;
  delete cv.properties;
  const oldDocument = CvDocument({ cvData: cv, options: { fontSize: 10 } });
  assert.equal(oldDocument.props.children.props.style[1].fontSize, 10);
});

test('multiple #### roles under one ### are all kept, with their own bullets', () => {
  const md = `# Jane Doe
- title: Engineer
- email: jane@example.com
## Experience
### Acme Corp | Remote
#### Senior Engineer | 2022–2024
- Led the platform team.
#### Engineer | 2019–2022
- Built the API.
- Wrote the docs.
### Other Co
#### Intern | 2018
- Fixed bugs.
`;
  const items = markdownToCv(md).sections[0].items;
  assert.equal(items.length, 3);
  assert.deepEqual(items[0], { primary: 'Acme Corp', primaryRight: 'Remote', details: ['Led the platform team.'], break: false, secondary: 'Senior Engineer', secondaryRight: '2022–2024' });
  assert.equal(items[1].primary, undefined);
  assert.equal(items[1].secondary, 'Engineer');
  assert.equal(items[1].secondaryRight, '2019–2022');
  assert.deepEqual(items[1].details, ['Built the API.', 'Wrote the docs.']);
  assert.equal(items[2].primary, 'Other Co');
  assert.equal(items[2].secondary, 'Intern');

  // single #### under ### is unchanged, and the multi-role CV round-trips
  const cv = markdownToCv(md);
  assert.deepEqual(markdownToCv(cvToMarkdown(cv)), cv);
});

test('asterisk and mixed list markers are read as bullets everywhere', () => {
  const md = `# Jane Doe
- title: Engineer
* email: jane@example.com
  * location: Remote
## Skills
* TypeScript
- React
## Experience
### Acme
#### Senior Engineer
- Built the API
* Led the team
#### Engineer
* Wrote the docs
* Fixed *flaky* tests
## Summary
*Emphasised* paragraph text stays plain.
`;
  assert.equal(validateCvMarkdown(md).isValid, true);
  const cv = markdownToCv(md);
  assert.equal(cv.contact.title, 'Engineer');
  assert.equal(cv.contact.email, 'jane@example.com');
  assert.equal(cv.contact.location, 'Remote');
  const [skills, experience, summary] = cv.sections;
  assert.deepEqual(skills.items[0].details, ['TypeScript', 'React']);
  assert.equal(experience.items.length, 2);
  assert.deepEqual(experience.items[0].details, ['Built the API', 'Led the team']);
  assert.equal(experience.items[1].secondary, 'Engineer');
  assert.deepEqual(experience.items[1].details, ['Wrote the docs', 'Fixed *flaky* tests']);
  assert.equal(summary.items[0].plain, true);
  assert.deepEqual(summary.items[0].details, ['*Emphasised* paragraph text stays plain.']);

  // Export keeps hyphen markers and re-imports to the same data.
  const exported = cvToMarkdown(cv);
  assert.doesNotMatch(exported, /^\* /m);
  assert.deepEqual(markdownToCv(exported), cv);
});

test('asterisk-only contact fields produce a valid CV', () => {
  const md = `# Jane Doe
* title: Engineer
* email: jane@example.com
## Experience
* Shipped things
`;
  assert.deepEqual(validateCvMarkdown(md), { isValid: true, errors: [] });
});
