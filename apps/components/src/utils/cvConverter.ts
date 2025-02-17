import { parse } from 'yaml';
import { ContactInfo, CvData, CvItem, CvProperties, CvSection } from "../types";


export const CV_STORAGE_KEY = 'cvData';

export function parseYamlFrontmatter(markdown: string): { properties: CvProperties, content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { properties: {}, content: markdown };
  }

  const [, frontmatter, content] = match;
  
  try {
    const properties = parse(frontmatter) as CvProperties;
    return { 
      properties: properties || {}, 
      content: content.trim() 
    };
  } catch (error) {
    console.error('Error parsing frontmatter:', error);
    return { properties: {}, content: markdown };
  }
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
        const headerLine = line.replace('### ', '');
        const hasBreak = headerLine.endsWith('\\break');
        const cleanHeader = hasBreak ? headerLine.slice(0, -6).trim() : headerLine;
        const [primary, primaryRight] = cleanHeader.split(' | ');
        currentItem = {
          primary,
          primaryRight,
          details: [],
          break: hasBreak
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
        const header = `### ${item.primary}${item.primaryRight ? ` | ${item.primaryRight}` : ''}${item.break ? ' \\break' : ''}\n`;
        markdown += header;
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

export function validateCvMarkdown(markdown: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { content } = parseYamlFrontmatter(markdown);
  
  // Validate that content starts with a level 1 heading (#)
  const firstNonEmptyLine = content.split('\n').find(line => line.trim());
  if (!firstNonEmptyLine?.startsWith('# ')) {
    errors.push('CV must start with a level 1 heading (#) containing the name');
  }

  const cv = markdownToCv(markdown);

  // Validate contact information
  const requiredContactFields: (keyof ContactInfo)[] = ['name', 'title', 'email'];
  requiredContactFields.forEach(field => {
    if (!cv.contact[field]) {
      errors.push(`Missing required contact field: ${field}`);
    }
  });

  // Validate sections
  if (!cv.sections.length) {
    errors.push('CV must have at least one section');
  }

  // Validate each section has a title and at least one item
  cv.sections.forEach((section, index) => {
    if (!section.title) {
      errors.push(`Section ${index + 1} is missing a title`);
    }
    if (!section.items.length) {
      errors.push(`Section "${section.title || index + 1}" must have at least one item`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
} 