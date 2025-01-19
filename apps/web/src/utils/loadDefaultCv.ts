import fs from 'fs';
import path from 'path';
import { CvData, markdownToCv } from './cvConverter';

export function loadDefaultCv(): CvData {
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
        location: '',
        links: [ 
          { text: 'linkedin', url: '' },
          { text: 'github', url: '' }
        ]
      },
      sections: []
    };
  }
} 