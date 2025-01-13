import fs from 'fs';
import path from 'path';
import { markdownToCv } from './cvConverter';

export function loadDefaultCv() {
  try {
    const markdownPath = path.join(process.cwd(), 'src/data/default.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    return markdownToCv(markdownContent);
  } catch (error) {
    console.error('Error loading default CV:', error);
    return {
      contact: {
        name: '',
        title: '',
        phone: '',
        email: '',
        links: {
          linkedin: { text: '', url: '' },
          github: { text: '', url: '' }
        }
      },
      sections: []
    };
  }
} 