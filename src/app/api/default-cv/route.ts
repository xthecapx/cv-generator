import { NextResponse } from 'next/server';
import { loadDefaultCv } from '@/utils/loadDefaultCv';
import { jsonToMarkdown, isValidCvData } from '@/utils/markdownConverter';

export async function GET() {
  try {
    const rawData = await loadDefaultCv();
    if (!isValidCvData(rawData)) {
      throw new Error('Invalid CV data format');
    }
    const markdown = jsonToMarkdown(rawData);
    return new NextResponse(markdown);
  } catch {
    return new NextResponse('Error loading CV', { status: 500 });
  }
} 