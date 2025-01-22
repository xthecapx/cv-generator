import { CvData, CvItem, CvProperties, CvSection } from "../types";


export const CV_STORAGE_KEY = 'cvData';

export function parseYamlFrontmatter(markdown: string): { properties: CvProperties, content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { properties: {}, content: markdown };
  }

  const [, frontmatter, content] = match;
  const properties: CvProperties = {};
  let currentArrayKey: string | null = null;

  frontmatter.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (trimmedLine.startsWith('- ') && currentArrayKey) {
      properties[currentArrayKey] = properties[currentArrayKey] || [];
      (properties[currentArrayKey] as string[]).push(trimmedLine.slice(2).trim());
      return;
    }

    const [key, ...valueParts] = trimmedLine.split(':');
    const trimmedKey = key?.trim();
    const value = valueParts.join(':').trim();
    
    if (!trimmedKey || value === '') {
      currentArrayKey = trimmedKey || null;
      return;
    }

    if (value.startsWith('- ')) {
      currentArrayKey = trimmedKey;
      properties[trimmedKey] = properties[trimmedKey] || [];
      (properties[trimmedKey] as string[]).push(value.slice(2).trim());
    } else {
      currentArrayKey = null;
      properties[trimmedKey] = value;
    }
  });

  return { properties, content: content.trim() };
}

export function markdownToCv(markdown: string): CvData {
  const { properties, content } = parseYamlFrontmatter(markdown);
  const lines = content.split('\n').filter(line => line.trim());
  const cv: CvData = {
    properties: Object.keys(properties).length > 0 ? properties : undefined,
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

    if (line.startsWith('# ')) {
      cv.contact.name = line.replace('# ', '');
      
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

    if (line.startsWith('## ')) {
      if (currentSection) {
        cv.sections.push(currentSection);
      }
      
      const title = line.replace('## ', '');
      currentSection = {
        title: title.replace('\\break', '').trim(),
        items: [],
        break: title.includes('\\break')
      };
      currentItem = null;
      continue;
    }

    if (line.startsWith('- ') && currentSection && !currentItem) {
      currentItem = {
        details: []
      };
      currentItem.details.push(line.replace('- ', ''));
      currentSection.items.push(currentItem);
      continue;
    }

    if (line.startsWith('### ')) {
      if (currentSection) {
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

    if (line.startsWith('#### ') && currentItem) {
      const [secondary, secondaryRight] = line.replace('#### ', '').split(' | ');
      currentItem.secondary = secondary;
      currentItem.secondaryRight = secondaryRight;
      continue;
    }

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

  if (cv.properties && Object.keys(cv.properties).length > 0) {
    markdown += '---\n';
    Object.entries(cv.properties).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        markdown += `${key}:\n${value.map(item => `  - ${item}`).join('\n')}\n`;
      } else if (value) {
        markdown += `${key}: ${value}\n`;
      }
    });
    markdown += '---\n\n';
  }

  markdown += `# ${cv.contact.name}\n`;
  markdown += `- title: ${cv.contact.title}\n`;
  markdown += `- Location: ${cv.contact.location}\n`;
  markdown += `- Phone: ${cv.contact.phone}\n`;
  markdown += `- Email: ${cv.contact.email}\n`;
  
  cv.contact.links.forEach(link => {
    markdown += `- ${link.text}: ${link.url}\n`;
  });

  markdown += '\n';

  cv.sections.forEach(section => {
    markdown += `## ${section.title}${section.break ? ' \\break' : ''}\n`;
    
    section.items.forEach(item => {
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