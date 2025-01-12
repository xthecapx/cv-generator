import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const markdownPath = path.join(process.cwd(), 'src/data/default.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    return new NextResponse(markdownContent, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  } catch (error) {
    return new NextResponse('Error loading default CV', { status: 500 });
  }
} 