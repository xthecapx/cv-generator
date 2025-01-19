export interface ContactInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  links: Array<{
    text: string;
    url: string;
  }>;
}

export interface CvItem {
  primary?: string;
  primaryRight?: string;
  secondary?: string;
  secondaryRight?: string;
  details: string[];
}

export interface CvSection {
  title: string;
  items: CvItem[];
}

export interface CvData {
  contact: ContactInfo;
  sections: CvSection[];
}

export const CV_STORAGE_KEY = 'cvData';

export function markdownToCv(markdown: string): CvData {
  const lines = markdown.split('\n').filter(line => line.trim());
  const cv: CvData = {
    contact: {
      name: '',
      title: '',
      phone: '',
      email: '',
      location: '',
      links: []
    },
    sections: []
  };

  let currentSection: CvSection | null = null;
  let currentItem: CvItem | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse contact section
    if (line.startsWith('# ')) {
      cv.contact.name = line.replace('# ', '');
      
      // Parse contact details
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        i++;
        const [key, value] = lines[i].replace('- ', '').split(': ');
        if (key.toLowerCase() === 'title') {
          cv.contact.title = value;
        } else if (key.toLowerCase() === 'phone') {
          cv.contact.phone = value;
        } else if (key.toLowerCase() === 'location') {
          cv.contact.location = value;
        } else if (key.toLowerCase() === 'email') {
          cv.contact.email = value;
        } else if (['linkedin', 'github'].includes(key.toLowerCase())) {
          cv.contact.links.push({
            text: key,
            url: value
          });
        }
      }
      continue;
    }

    // Parse sections
    if (line.startsWith('## ')) {
      if (currentSection) {
        // Add current section to CV
        cv.sections.push(currentSection);
      }
      // Create new section and reset current item
      currentSection = {
        title: line.replace('## ', ''),
        items: []
      };
      currentItem = null;
      continue;
    }

    // Handle bullet points directly after ## (section-level items)
    if (line.startsWith('- ') && currentSection && !currentItem) {
      currentItem = {
        details: []
      };
      currentItem.details.push(line.replace('- ', ''));
      currentSection.items.push(currentItem);
      continue;
    }

    // Parse subsection items (###)
    if (line.startsWith('### ')) {
      if (currentSection) {
        // Start new item
        const [primary, primaryRight] = line.replace('### ', '').split(' | ');
        currentItem = {
          primary,
          primaryRight,
          details: []
        };
        currentSection.items.push(currentItem);
      }
      continue;
    }

    // Parse secondary information (####)
    if (line.startsWith('#### ') && currentItem) {
      const [secondary, secondaryRight] = line.replace('#### ', '').split(' | ');
      currentItem.secondary = secondary;
      currentItem.secondaryRight = secondaryRight;
      continue;
    }

    // Parse details
    if (line.startsWith('- ') && currentItem) {
      currentItem.details.push(line.replace('- ', ''));
      continue;
    }
  }

  if (currentSection) {
    cv.sections.push(currentSection);
  }

  return cv;
}

export function cvToMarkdown(cv?: CvData): string {
  if (!cv) return '';

  let markdown = '';

  // Contact section
  markdown += `# ${cv.contact.name}\n`;
  markdown += `- title: ${cv.contact.title}\n`;
  markdown += `- Location: ${cv.contact.location}\n`;
  markdown += `- Phone: ${cv.contact.phone}\n`;
  markdown += `- Email: ${cv.contact.email}\n`;
  
  cv.contact.links.forEach(link => {
    markdown += `- ${link.text}: ${link.url}\n`;
  });

  markdown += '\n';

  // Other sections
  cv.sections.forEach(section => {
    markdown += `## ${section.title}\n`;
    
    section.items.forEach(item => {
      // Only add subsection headers if they have content
      if (item.primary) {
        markdown += `### ${item.primary}${item.primaryRight ? ` | ${item.primaryRight}` : ''}\n`;
      }
      if (item.secondary) {
        markdown += `#### ${item.secondary}${item.secondaryRight ? ` | ${item.secondaryRight}` : ''}\n`;
      }
      
      item.details.forEach(detail => {
        markdown += `- ${detail}\n`;
      });
      markdown += '\n';
    });
  });

  return markdown.trim();
} 