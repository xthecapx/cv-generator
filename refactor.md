# CV Generator improvement plan

Start with the list bug. It affects both the web app and the Obsidian plugin and can silently remove an achievement from a valid CV. Budget roughly 2–4 hours for the four tasks below. The first task is a useful standalone session. Releases are manual and outside this estimate.

## Baseline

At monorepo commit `40dde76d` (Obsidian `1.0.10`), all 36 component, plugin, and release-script tests passed. Web lint and both production builds passed. The web build needed network access to download Google Fonts. The production dependency audit reported 2 high and 11 moderate findings. Refresh the audit when starting work because advisory data changes.

## 1. Fix Markdown list handling · 20–40 minutes

Use this CV to reproduce the bug. Validation succeeds, but the PDF omits “Led the team.”

```markdown
# Jane Doe
- title: Engineer
- email: jane@example.com
## Experience
### Acme
#### Senior Engineer
- Built the API
* Led the team
```

- [ ] Add a failing regression test in `apps/components/tests/cv.test.mjs`. Cover asterisk-only, hyphen-only, and mixed lists in contact fields, directly under a section, and beneath successive roles. Include an indented contact field.
- [ ] Update the three list-reading paths in `apps/components/src/utils/cvConverter.ts` to recognize either marker followed by whitespace. Preserve plain paragraphs and inline emphasis. Keep the existing hyphen format for Markdown export.
- [ ] Run `pnpm --filter @thecap-cv/components test`. Check that parsing exported Markdown reproduces the same CV data and keeps each achievement under its original role.
- [ ] Render the fixture with the shared PDF component. Verify that the PDF contains both achievement texts in order, each as its own bullet. Check that changing the contact markers to asterisks still produces a valid CV.

## 2. Remediate dependency advisories · 30–75 minutes

- [ ] Run `pnpm audit --prod` and trace each affected package with `pnpm why -r <package>`. The baseline included high findings in `lodash` and `source-map-js`, as well as findings in `yaml` and the pinned Next.js version. Review which affected functions or configurations the apps actually use.
- [ ] Make targeted dependency and lockfile updates in a separate change from the list fix. For a transitive dependency, check whether updating its direct parent resolves the finding.
- [ ] Repeat the audit. Record any remaining advisory, its dependency path, and why it remains. Run the checks below and render the same CV again to catch PDF or font regressions.

## 3. Preserve the latest web draft · 30–60 minutes

The web editor stores parsed CV data and reconstructs Markdown when edit mode opens. Text the parser skips can disappear from the next session. Preview updates are debounced for two seconds, while export reads the parsed state. Start in `apps/web/src/app/page.tsx`.

- [ ] Preserve the raw Markdown draft as the editing and export source. Let PDF preview updates remain debounced. Support users whose browser storage contains only the older parsed CV.
- [ ] Verify that import and reset update the draft, preview, and stored CV consistently. Check that a pending edit cannot overwrite a subsequent import or reset.
- [ ] Type a distinctive final line and immediately exit edit mode and export. Repeat with an immediate reload. Confirm the exact line survives in the downloaded Markdown and reopened editor, and that the preview catches up. Repeat with a previously saved CV.

## 4. Evaluate the user workflows · 20–45 minutes

- [ ] In the web app, import the fixture, edit it, preview the PDF, export Markdown, and re-import it. Add a second role under Acme and verify that each role keeps its own dates and bullets. Try the same flow using a keyboard and a narrow viewport.
- [ ] Align the web file picker in `apps/web/src/components/FloatingActions.tsx` with the Markdown-only upload handler. Verify that the picker advertises the supported format.
- [ ] In an Obsidian test vault, open the same note with the locally built plugin and inspect the PDF preview. Compare contact fields, role order, and achievements with the web output. Record the Obsidian version used.
- [ ] Record additional findings with reproduction steps and user impact. Estimate any follow-up fixes separately.

## Verification commands

Run these from the monorepo root with the Obsidian submodule initialized and workspace dependencies installed. The build commands refresh the shared bundle used by the tests.

```sh
pnpm build:obsidian
pnpm build:web
pnpm lint:web
node --test apps/components/tests/*.test.mjs apps/obsidian/tests/*.test.mjs scripts/release-obsidian.test.mjs
```
