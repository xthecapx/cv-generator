import fs from 'fs';
import path from 'path';
import { markdownToJson } from './markdownConverter';

export function loadDefaultCv() {
  try {
    const markdownPath = path.join(process.cwd(), 'src/data/default.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    return markdownToJson(markdownContent);
  } catch (error) {
    console.error('Error loading default CV:', error);
    return {
      contact: {
        name: '',
        title: '',
        email: '',
        phone: '',
        links: {
          linkedin: '',
          github: ''
        }
      },
      sections: []
    };
  }
} 