export const CV_STORAGE_KEY = 'cv-data';

interface CvItem {
  primary?: string;
  primaryRight?: string;
  secondary?: string;
  secondaryRight?: string;
  details: string[];
  type?: 'list' | 'paragraph';
}

interface ContactLink {
  text: string;
  url: string;
}

export interface CvData {
  contact: {
    name: string;
    title: string;
    email: ContactLink;
    phone: ContactLink;
    links: {
      linkedin: ContactLink;
      github: ContactLink;
    };
  };
  sections: Array<{
    title: string;
    isVisible: boolean;
    items: CvItem[];
  }>;
}

function parseContactLink(text: string): ContactLink {
  const [label, value] = text.split(': ');
  if (label === 'Phone') {
    return {
      text: value,
      url: `tel:${value.replace(/\s+/g, '')}`
    };
  }
  if (label === 'Email') {
    return {
      text: value,
      url: `mailto:${value.trim()}`
    };
  }
  // For LinkedIn and GitHub, the value is already a URL
  return {
    text: value,
    url: value.trim()
  };
}

type Section = CvData['sections'][0];
type Item = CvItem;

export function markdownToJson(markdown: string): CvData {
  const lines = markdown.split('\n').filter(line => line.trim());
  const cvData: CvData = {
    contact: {
      name: '',
      title: '',
      email: { text: '', url: '' },
      phone: { text: '', url: '' },
      links: {
        linkedin: { text: '', url: '' },
        github: { text: '', url: '' }
      }
    },
    sections: []
  };

  let currentSection: Section | null = null;
  let currentItem: Item | null = null;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      // Name
      cvData.contact.name = line.substring(2);
    } else if (!cvData.contact.title && !line.startsWith('-') && !line.startsWith('#')) {
      // Title (first non-# line after name)
      cvData.contact.title = line;
    } else if (line.startsWith('## ')) {
      // Section
      currentSection = {
        title: line.substring(3),
        isVisible: true,
        items: []
      };
      cvData.sections.push(currentSection);
      currentItem = { details: [], type: 'list' };
      currentSection.items.push(currentItem);
    } else if (line.startsWith('### ')) {
      // Primary line
      if (currentSection) {
        const [primary, primaryRight] = line.substring(4).split(' | ');
        const isParagraph = primary.toLowerCase().includes('summary') || 
                          primary.toLowerCase().includes('profile') ||
                          primary.toLowerCase().includes('about');
        currentItem = {
          primary,
          primaryRight,
          details: [],
          type: isParagraph ? 'paragraph' : 'list'
        };
        currentSection.items.push(currentItem);
      }
    } else if (line.startsWith('#### ')) {
      // Secondary line
      if (currentItem) {
        const [secondary, secondaryRight] = line.substring(5).split(' | ');
        currentItem.secondary = secondary;
        if (secondaryRight) currentItem.secondaryRight = secondaryRight;
      }
    } else if (line.startsWith('- ')) {
      // Detail or contact info
      const detail = line.substring(2);
      if (detail.startsWith('Phone: ')) {
        cvData.contact.phone = parseContactLink(detail);
      } else if (detail.startsWith('Email: ')) {
        cvData.contact.email = parseContactLink(detail);
      } else if (detail.startsWith('LinkedIn: ')) {
        cvData.contact.links.linkedin = parseContactLink(detail);
      } else if (detail.startsWith('GitHub: ')) {
        cvData.contact.links.github = parseContactLink(detail);
      } else if (currentSection) {
        if (!currentItem || !currentItem.details) {
          currentItem = { details: [] };
          currentSection.items.push(currentItem);
        }
        currentItem.details.push(detail);
      }
    } else if (currentSection && currentItem?.type === 'paragraph' && !line.startsWith('#') && !line.startsWith('-')) {
      // Handle paragraph text
      const text = line.trim();
      if (text) {
        currentItem.details.push(text);
      }
    }
  }

  return cvData;
}

export function jsonToMarkdown(cvData: CvData): string {
  let markdown = '';

  // Contact Section
  markdown += `# ${cvData.contact.name}\n`;
  markdown += `${cvData.contact.title || ''}\n\n`;
  markdown += `- Phone: ${cvData.contact.phone.text}\n`;
  markdown += `- Email: ${cvData.contact.email.text}\n`;
  markdown += `- LinkedIn: ${cvData.contact.links.linkedin.text}\n`;
  markdown += `- GitHub: ${cvData.contact.links.github.text}\n\n`;

  // Other Sections
  cvData.sections.forEach((section) => {
    if (section.isVisible) {
      markdown += `## ${section.title}\n\n`;
      
      section.items.forEach((item) => {
        if (item.primary) {
          markdown += `### ${item.primary}${item.primaryRight ? ` | ${item.primaryRight}` : ''}\n`;
        }
        if (item.secondary) {
          markdown += `#### ${item.secondary}${item.secondaryRight ? ` | ${item.secondaryRight}` : ''}\n`;
        }
        if (item.details?.length) {
          if (item.type === 'paragraph') {
            // Join paragraph lines with spaces
            markdown += `${item.details.join(' ')}\n`;
          } else {
            // Regular bullet point list
            item.details.forEach((detail) => {
              markdown += `- ${detail}\n`;
            });
          }
        }
        markdown += '\n';
      });
    }
  });

  return markdown;
}

export function isValidCvData(data: any): data is CvData {
  try {
    if (!data?.contact || !data?.sections) {
      console.error('Missing required top-level fields');
      return false;
    }

    // Convert old contact format to new format if needed
    if (typeof data.contact.phone === 'string') {
      data.contact = {
        ...data.contact,
        phone: { text: data.contact.phone, url: `tel:${data.contact.phone.replace(/\s+/g, '')}` },
        email: { text: data.contact.email, url: `mailto:${data.contact.email}` },
        links: {
          linkedin: { text: data.contact.links.linkedin, url: `https://${data.contact.links.linkedin}` },
          github: { text: data.contact.links.github, url: `https://${data.contact.links.github}` }
        }
      };
    }

    // Validate sections
    if (!Array.isArray(data.sections)) {
      console.error('Sections is not an array');
      return false;
    }

    return data.sections.every((section, idx) => {
      if (!section.title || typeof section.isVisible !== 'boolean' || !Array.isArray(section.items)) {
        console.error(`Invalid section at index ${idx}`);
        return false;
      }

      return section.items.every((item, itemIdx) => {
        if (!Array.isArray(item.details)) {
          console.error(`Invalid details array in section ${idx}, item ${itemIdx}`);
          return false;
        }
        return true;
      });
    });
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
} 