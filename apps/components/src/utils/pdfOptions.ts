export const DEFAULT_PDF_FONT_SIZE = 12;

export function pdfFontSize(value: unknown, fallback = DEFAULT_PDF_FONT_SIZE): number {
  const size = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof size === 'number' && Number.isFinite(size) && size >= 8 && size <= 20
    ? size : fallback;
}

/** Keep supported schemes intact; never turn arbitrary schemes into PDF actions. */
export function contactUrl(value: string, allowBareDomain = false): string | undefined {
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  if (/^www\./i.test(value) || (allowBareDomain && /^[\w.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(value))) {
    return `https://${value}`;
  }
  return undefined;
}
