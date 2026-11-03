# TheCAP CV Generator

A monorepo containing multiple applications for CV generation using a common markdown format. This project allows you to manage your CV in markdown and generate beautiful PDFs across different platforms.

## Project Structure 
    .
    ├── apps/
    │   ├── components/ # Shared React components for CV rendering
    │   ├── web/       # Web application (Next.js)
    │   ├── obsidian/  # Obsidian plugin
    │   └── vscode/    # VSCode extension (coming soon)

## Applications

### Web Application (In Development)
A Next.js application that provides a web interface for editing and previewing your CV.

### Obsidian Plugin (In Development)
A plugin for Obsidian that allows you to manage and preview your CV directly within your vault.

## Development

### Prerequisites

- Node.js >= 20.9.0
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

## Publishing the Obsidian plugin

Run releases from this monorepo, where the shared components can be built. Install
the GitHub CLI (`gh`) and sign in with `gh auth login` using an account that can
push to both repositories. Commit your changes first, and check out `main` in both
the monorepo and `apps/obsidian`. Install dependencies with `pnpm install`.

Preview the next release without changing files or contacting GitHub:

```bash
pnpm release:obsidian 1.0.8 --dry-run
```

After testing the plugin locally, publish it with:

```bash
pnpm release:obsidian 1.0.8
```

Choose a version newer than the current plugin version, in `x.y.z` format without
a `v` prefix. The command updates `package.json`, `manifest.json`, and
`versions.json` directly, preserving `minAppVersion` and avoiding npm's
incompatibility with `workspace:*` dependencies. It builds the shared components
and plugin, commits the version files, creates an annotated tag, and pushes the
plugin's `main` branch and tag to `xthecapx/Thecap-cv-generator`. It also commits
and pushes the updated submodule reference in `xthecapx/cv-generator`.

The GitHub release starts as a draft. The command uploads `main.js`,
`manifest.json`, and `styles.css`, verifies the attachments, and publishes the
release as the latest stable version. Running this command pushes commits and
publishes publicly without another confirmation prompt.

If a build fails before the version commit, the original version files are
restored. Fix the error and rerun the same command. If a later step fails, the
command preserves its commits and any draft release. Keep the source unchanged,
resolve the reported problem, and continue with:

```bash
pnpm release:obsidian 1.0.8 --resume
```

Resume refuses tags pointing to a different commit and never replaces attachments
on an already-public release. No new npm package or Obsidian directory submission
is needed for this release workflow. Run `pnpm test:release` to check the script's
success and failure paths without making real releases.

## Markdown Format

The CV format follows a specific structure that maps to our type definitions. Here's a detailed breakdown:

### Properties (YAML Frontmatter)

Properties are defined at the top of the file. Set `font-size` to a number from 8 to 20 to scale the PDF text (the default is 12). In Obsidian, this overrides the plugin's default PDF text size for this note:

```yaml
---
title: Title property
year: 2025
favorite: true
font-size: 12
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
- Website: [Portfolio](https://example.com)
- Languages: English: fluent; Spanish: fluent
```

`title` appears beneath your name. Phone, email, location, LinkedIn, and GitHub
have built-in formatting; any other `key: value` entries appear in the contact
header with their labels preserved. Values may contain colons. Use a full
`https://` URL or a Markdown link for clickable custom fields.

For Chinese and other characters outside the default font's coverage, the
Obsidian plugin can load a font from your vault. See the plugin's
[PDF font settings](apps/obsidian/README.md#pdf-text-size-and-fonts).

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
