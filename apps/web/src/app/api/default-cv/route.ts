import { NextResponse } from 'next/server';
import { loadDefaultCv } from '@/utils/loadDefaultCv';
import { cvToMarkdown } from '@thecap-cv/components';

export async function GET() {
  try {
    const cvData = await loadDefaultCv();
    const markdown = cvToMarkdown(cvData);
    return new NextResponse(markdown);
  } catch {
    return new NextResponse('Error loading CV', { status: 500 });
  }
} 