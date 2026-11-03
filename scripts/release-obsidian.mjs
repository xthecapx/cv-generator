import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repository = 'xthecapx/Thecap-cv-generator';
const versionFiles = ['package.json', 'manifest.json', 'versions.json'];
const assetNames = ['main.js', 'manifest.json', 'styles.css'];
const help = `Usage: pnpm release:obsidian <version> [--dry-run | --resume]

Example: pnpm release:obsidian 1.0.8
Commit your changes first. Requires main in both repositories, pnpm, and gh auth login.
Creates and pushes version commits in both repositories, a tag, and a public GitHub release.
--dry-run  Print the plan without changing files, building, or accessing the network.
--resume   Continue an interrupted release after its plugin version commit was created.`;

function execute(command, args, cwd, capture = true) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit',
    env: { ...process.env, GH_PROMPT_DISABLED: '1' },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed.\n${result.stderr || result.stdout || ''}`);
  }
  return (result.stdout || '').trim();
}

export function parseVersion(value) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) {
    throw new Error('Use an exact Obsidian version such as 1.0.8, without a v prefix or prerelease suffix.');
  }
  return value.split('.').map(BigInt);
}

function isNewer(next, current) {
  const previous = parseVersion(current);
  for (const [index, part] of parseVersion(next).entries()) {
    if (part !== previous[index]) return part > previous[index];
  }
  return false;
}

export function verifyAssets(release, assets) {
  const names = release.assets.map(asset => asset.name).sort();
  if (JSON.stringify(names) !== JSON.stringify([...assetNames].sort())) {
    throw new Error('Release must contain exactly main.js, manifest.json, and styles.css. It has not been published by this run.');
  }
  for (const local of assets) {
    const remote = release.assets.find(asset => asset.name === local.name);
    if (remote.state !== 'uploaded' || remote.size !== local.size ||
        (remote.digest && remote.digest !== local.digest)) {
      throw new Error(`Release attachment ${local.name} does not match the built file. It has not been published by this run.`);
    }
  }
}

export function releaseObsidian(version, {
  root = rootDirectory, dryRun = false, resume = false, run = execute,
} = {}) {
  parseVersion(version);
  const plugin = join(root, 'apps/obsidian');
  const read = name => JSON.parse(readFileSync(join(plugin, name), 'utf8'));
  const pkg = read('package.json');
  const manifest = read('manifest.json');
  const versions = read('versions.json');
  if (pkg.version !== manifest.version) throw new Error('Plugin package.json and manifest.json versions must match first.');
  if (resume ? version !== manifest.version : !isNewer(version, manifest.version)) {
    throw new Error(resume ? 'Resume must use the current plugin version.' : `Version must be newer than ${manifest.version}.`);
  }
  if (resume && versions[version] !== manifest.minAppVersion) throw new Error('versions.json does not match the release manifest.');
  console.log(`Release ${repository}: ${manifest.version} → ${version}`);
  if (dryRun) {
    console.log('Plan: check clean main branches and remotes → update version files → build plugin → commit and tag plugin → push plugin → commit and push parent reference → create draft → upload and verify main.js, manifest.json, styles.css → publish.');
    return;
  }

  const git = (cwd, ...args) => run('git', args, cwd);
  const gh = (...args) => run('gh', args, root);
  const releaseMessage = `chore: release ${version}`;
  for (const [cwd, expectedRepo] of [[root, 'xthecapx/cv-generator'], [plugin, repository]]) {
    if (git(cwd, 'branch', '--show-current') !== 'main') throw new Error(`Check out main in ${cwd} first.`);
    const status = git(cwd, 'status', '--porcelain');
    // A committed plugin release can leave only its parent gitlink changed during recovery.
    if (status && !(resume && cwd === root && status.trim() === 'M apps/obsidian')) {
      throw new Error(`Commit or stash changes in ${cwd} first (including staged and untracked files).`);
    }
    const remote = git(cwd, 'remote', 'get-url', 'origin').replace(/\.git$/, '').toLowerCase();
    const suffix = expectedRepo.toLowerCase();
    if (!remote.endsWith(`/${suffix}`) && !remote.endsWith(`:${suffix}`)) {
      throw new Error(`Unexpected origin in ${cwd}; expected ${expectedRepo}.`);
    }
    git(cwd, 'fetch', 'origin', 'main');
    git(cwd, 'merge-base', '--is-ancestor', 'origin/main', 'HEAD');
  }
  if (!git(root, 'ls-files', '--stage', 'apps/obsidian').startsWith('160000 ')) {
    throw new Error('apps/obsidian must be a Git submodule.');
  }
  gh('auth', 'status');
  const releases = JSON.parse(gh('api', `repos/${repository}/releases`, '--paginate', '--slurp')).flat();
  let release = releases.find(item => item.tag_name === version);
  const localTag = git(plugin, 'tag', '--list', version);
  const remoteTag = git(plugin, 'ls-remote', '--tags', 'origin', `refs/tags/${version}`, `refs/tags/${version}^{}`);
  if (!resume && (release || localTag || remoteTag)) throw new Error(`Tag or release ${version} already exists; choose a new version.`);
  if (resume) {
    if (git(plugin, 'log', '-1', '--format=%s') !== releaseMessage) {
      throw new Error('Resume requires HEAD to be the original plugin release commit.');
    }
    const head = git(plugin, 'rev-parse', 'HEAD');
    if (localTag && git(plugin, 'rev-parse', `${version}^{commit}`) !== head) throw new Error('Local tag points to a different commit.');
    if (remoteTag) {
      const lines = remoteTag.split('\n');
      const target = lines.find(line => line.endsWith('^{}')) || lines[0];
      if (target.split(/\s+/)[0] !== head) throw new Error('Remote tag points to a different commit.');
    }
  }

  const originals = versionFiles.map(name => [name, readFileSync(join(plugin, name))]);
  let versionCommitted = resume;
  try {
    if (!resume) {
      pkg.version = manifest.version = version;
      versions[version] = manifest.minAppVersion;
      for (const [name, data] of [['package.json', pkg], ['manifest.json', manifest], ['versions.json', versions]]) {
        writeFileSync(join(plugin, name), `${JSON.stringify(data, null, '\t')}\n`);
      }
    }
    // Remove the ignored bundle so a failed/no-op build cannot publish an old artifact.
    rmSync(join(plugin, 'main.js'), { force: true });
    run('pnpm', ['build:obsidian'], root, false);
    const assets = assetNames.map(name => {
      const path = join(plugin, name);
      if (!statSync(path).isFile() || statSync(path).size === 0) throw new Error(`Missing or empty release asset: ${name}`);
      return { name, path, size: statSync(path).size, digest: `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}` };
    });
    if (read('manifest.json').version !== version) throw new Error('Built manifest version changed unexpectedly.');
    if (!resume) {
      git(plugin, 'add', '--', ...versionFiles);
      git(plugin, 'commit', '-m', releaseMessage);
      versionCommitted = true;
    }
    if (!localTag && remoteTag) git(plugin, 'fetch', 'origin', 'tag', version);
    else if (!localTag) git(plugin, 'tag', '-a', version, '-m', `Obsidian plugin ${version}`);
    git(plugin, 'push', '--atomic', 'origin', 'HEAD:refs/heads/main', `refs/tags/${version}`);

    if (git(root, 'status', '--porcelain', '--', 'apps/obsidian')) {
      git(root, 'add', '--', 'apps/obsidian');
      git(root, 'commit', '-m', `chore: update Obsidian plugin to ${version}`);
    }
    git(root, 'push', 'origin', 'HEAD:refs/heads/main');

    if (!release) {
      gh('release', 'create', version, '--repo', repository, '--verify-tag', '--draft', '--title', `Obsidian plugin ${version}`, '--generate-notes');
      release = { draft: true };
    }
    if (release.draft) {
      gh('release', 'upload', version, ...assets.map(asset => asset.path), '--repo', repository, '--clobber');
    }
    release = JSON.parse(gh('api', `repos/${repository}/releases/tags/${version}`));
    verifyAssets(release, assets);
    if (release.prerelease) throw new Error('Expected a stable release, not a prerelease.');
    if (release.draft) gh('release', 'edit', version, '--repo', repository, '--draft=false', '--latest', '--verify-tag');
    const published = JSON.parse(gh('api', `repos/${repository}/releases/tags/${version}`));
    verifyAssets(published, assets);
    if (published.draft || published.prerelease) throw new Error('GitHub did not confirm a public stable release.');
    console.log(`Published ${published.html_url}`);
  } catch (error) {
    if (!versionCommitted) {
      // Preflight required a clean plugin, so only our own version edits are restored.
      for (const [name, content] of originals) writeFileSync(join(plugin, name), content);
      git(plugin, 'reset', '--', ...versionFiles);
      console.error('Release stopped; original version files restored. Fix the error and rerun the same command.');
    } else {
      console.error(`Release stopped; commits and any draft are preserved. Fix the error, then run: pnpm release:obsidian ${version} --resume`);
    }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2).filter(arg => arg !== '--');
    if (args.includes('--help') || args.includes('-h')) {
      console.log(help);
    } else {
      const [version, ...flags] = args;
      if (!version || flags.some(flag => !['--dry-run', '--resume'].includes(flag)) || new Set(flags).size !== flags.length || flags.length > 1) {
        throw new Error(help);
      }
      releaseObsidian(version, { dryRun: flags.includes('--dry-run'), resume: flags.includes('--resume') });
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
