# TheCAP CV Generator

A monorepo containing multiple applications for CV generation using a common markdown format. This project allows you to manage your CV in markdown and generate beautiful PDFs across different platforms.

## Project Structure 

├── apps/
│ ├── components/ # Shared React components for CV rendering
│ ├── web/ # Web application (Next.js)
│ ├── obsidian/ # Obsidian plugin
│ └── vscode/ # VSCode extension (coming soon)

## Applications

### Web Application (In Development)
A Next.js application that provides a web interface for editing and previewing your CV.

### Obsidian Plugin (In Development)
A plugin for Obsidian that allows you to manage and preview your CV directly within your vault.

## Development

### Prerequisites

- Node.js >= 10
- pnpm >= 9

### Setup

#### Install dependencies
```bash
pnpm install
```

#### Start web development server
```bash
pnpm dev
```

#### Start Obsidian plugin development

## Obsidian Plugin Setup

To develop the Obsidian plugin, you need to create a symbolic link to your Obsidian plugins directory:

```bash
ln -s <project-path>/apps/obsidian <obsidian-vault-path>/.obsidian/plugins/thecap-cv-generator
```

Then, start the Obsidian plugin development server:

```bash
pnpm dev:obsidian
```

## Markdown Format

The CV format follows a specific structure that maps to our type definitions. Here's a detailed breakdown:

### Properties (YAML Frontmatter)

Properties are defined at the top of the file and will be used for metadata and filtering (future feature):

```yaml
---
title: Title property
year: 2025
favorite: true
tags:
  - CV
  - Curriculum Vitae
  - Resume
---
```

### Contact Information

The contact section starts with an H1 heading containing your name, followed by a list of contact details. This maps to the `ContactInfo` type:

```markdown
# McLOVIN
- title: Quantum Blockchain Architect
- Phone: +1 (808) 555-0111
- Email: mclovin@hawaii.gov
- Location: Honolulu, HI
- LinkedIn: linkedin.com/in/mclovin-hawaii
- GitHub: github.com/thereal-mclovin
```

### Sections

Each section of your CV is structured as follows:

1. **Section Title**: Uses H2 heading (##)
2. **Items**: Can have up to 4 components:
   - `primary`: H3 heading
   - `primaryRight`: After the | symbol in H3
   - `secondary`: H4 heading
   - `secondaryRight`: After the | symbol in H4
   - `details`: Bullet points under each item

Example section:

```markdown
## PROFESSIONAL EXPERIENCE
### Superbad Security Inc. | Remote
#### Chief Identity Officer | 2007 - Present
- Developed revolutionary age verification algorithms
- Led a team of undercover developers
```

Maps to:
```typescript
{
  title: "PROFESSIONAL EXPERIENCE",
  items: [{
    primary: "Superbad Security Inc.",
    primaryRight: "Remote",
    secondary: "Chief Identity Officer",
    secondaryRight: "2007 - Present",
    details: [
      "Developed revolutionary age verification algorithms",
      "Led a team of undercover developers"
    ]
  }]
}
```

### Special Formatting

To force a page break before a section, add \break to the section title:

```markdown
## CERTIFICATIONS \break
```

For a complete example, check [apps/web/src/data/default.md](apps/web/src/data/default.md).

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details.

What this means:
- ✔️ You can use this software for commercial purposes
- ✔️ You can modify the source code
- ✔️ You can distribute modified versions
- ❗ You must keep the source code open source
- ❗ You must state changes made to the code
- ❗ You must disclose your source code
- ❗ You must use the same license (GPL-3.0)
