const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const CLOSING = /[、。，！？：；）】》」』〉〕〗〙〛,.!?;:)\]\p{Mark}\uFE00-\uFE0F]/u;
const OPENING = /^[（【《「『〈〔〖〘〚(\[]+$/u;

/** Empty syllables create zero-width break opportunities without adding hyphens. */
export function splitCjkWord(word: string): string[] {
  if (!CJK.test(word)) return [word];
  const segments: string[] = [];
  let latin = '';
  for (const char of Array.from(word)) {
    if (CJK.test(char)) {
      if (latin && !OPENING.test(latin)) segments.push(latin);
      segments.push((OPENING.test(latin) ? latin : '') + char);
      latin = '';
    } else if (CLOSING.test(char) && !latin && segments.length) {
      segments[segments.length - 1] += char;
    } else {
      latin += char;
    }
  }
  if (latin) segments.push(latin);
  return segments.flatMap(segment => [segment, '']);
}

export function cjkHyphenation(text: string) {
  return CJK.test(text) ? splitCjkWord : undefined;
}
