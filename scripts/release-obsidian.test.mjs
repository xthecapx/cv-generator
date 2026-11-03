import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { parseVersion, releaseObsidian } from './release-obsidian.mjs';

function fixture(t, {
  fail, dirty = false, wrongAsset = false, resume = false,
  remoteTag = '', existingRelease = false, publicRelease = false, badDigest = false,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'obsidian-release-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const plugin = join(root, 'apps/obsidian');
  mkdirSync(plugin, { recursive: true });
  const current = resume ? '1.0.8' : '1.0.7';
  const write = (name, value) => writeFileSync(join(plugin, name), JSON.stringify(value));
  write('package.json', { version: current, dependencies: { shared: 'workspace:*' } });
  write('manifest.json', { version: current, minAppVersion: '1.0.6' });
  write('versions.json', { [current]: '1.0.6' });
  writeFileSync(join(plugin, 'styles.css'), 'body {}');
  const calls = [];
  let draft = !publicRelease;
  let uploaded = publicRelease;
  const release = () => ({
    tag_name: '1.0.8', draft, prerelease: false, html_url: 'https://github.com/example/release',
    assets: uploaded ? ['main.js', 'manifest.json', 'styles.css'].map(name => {
      const bytes = readFileSync(join(plugin, name));
      return {
        name: wrongAsset && name === 'main.js' ? 'main.ts' : name,
        size: bytes.length, state: 'uploaded',
        digest: badDigest ? 'sha256:incorrect' : `sha256:${createHash('sha256').update(bytes).digest('hex')}`,
      };
    }) : [],
  });
  const run = (command, args, cwd) => {
    const call = { command, args, cwd };
    calls.push(call);
    if (fail?.(call)) throw new Error('Simulated failure');
    if (command === 'pnpm') {
      assert.deepEqual(args, ['build:obsidian']);
      writeFileSync(join(plugin, 'main.js'), '/* freshly built plugin */');
      return '';
    }
    if (command === 'git') {
      if (args[0] === 'branch') return 'main';
      if (args[0] === 'status') {
        if (args.includes('--')) return ' M apps/obsidian';
        return dirty ? ' M source.ts' : '';
      }
      if (args[0] === 'remote') return `git@github.com-xthecapx:xthecapx/${cwd === root ? 'cv-generator' : 'thecap-cv-generator'}.git`;
      if (args[0] === 'ls-files') return '160000 abc 0\tapps/obsidian';
      if (args[0] === 'tag' && args[1] === '--list') return '';
      if (args[0] === 'ls-remote') return remoteTag;
      if (args[0] === 'log') return 'chore: release 1.0.8';
      if (args[0] === 'rev-parse') return 'abc';
      if (['fetch', 'merge-base', 'add', 'commit', 'tag', 'push', 'reset'].includes(args[0])) return '';
    }
    if (command === 'gh') {
      if (args[0] === 'auth') return '';
      if (args[0] === 'api') return JSON.stringify(args.includes('--slurp') ? [existingRelease ? [{ tag_name: '1.0.8', draft }] : []] : release());
      if (args[1] === 'create') {
        assert.ok(args.includes('--draft'));
        assert.ok(args.includes('--verify-tag'));
        return '';
      }
      if (args[1] === 'upload') {
        assert.deepEqual(args.slice(3, 6), ['main.js', 'manifest.json', 'styles.css'].map(name => join(plugin, name)));
        uploaded = true;
        return '';
      }
      if (args[1] === 'edit') {
        assert.ok(uploaded);
        assert.ok(args.includes('--draft=false'));
        draft = false;
        return '';
      }
    }
    throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
  };
  return { root, plugin, calls, run };
}

test('only accepts exact stable Obsidian versions', () => {
  assert.deepEqual(parseVersion('1.10.0'), [1n, 10n, 0n]);
  for (const version of ['v1.0.8', '1.0', '01.0.8', '1.0.8-beta', 'patch', '1.0.8;echo bad']) {
    assert.throws(() => parseVersion(version));
  }
});

test('dry-run does not write files or run commands', t => {
  const f = fixture(t);
  const before = readFileSync(join(f.plugin, 'package.json'), 'utf8');
  releaseObsidian('1.0.8', { ...f, dryRun: true });
  assert.equal(f.calls.length, 0);
  assert.equal(readFileSync(join(f.plugin, 'package.json'), 'utf8'), before);
});

test('builds, pushes both repos, verifies attachments, then publishes', t => {
  const f = fixture(t);
  releaseObsidian('1.0.8', f);
  const pkg = JSON.parse(readFileSync(join(f.plugin, 'package.json')));
  assert.equal(pkg.version, '1.0.8');
  assert.equal(pkg.dependencies.shared, 'workspace:*');
  assert.deepEqual(JSON.parse(readFileSync(join(f.plugin, 'versions.json'))), { '1.0.7': '1.0.6', '1.0.8': '1.0.6' });
  const index = predicate => f.calls.findIndex(predicate);
  const build = index(c => c.command === 'pnpm');
  const tag = index(c => c.command === 'git' && c.args[0] === 'tag' && c.args[1] === '-a');
  const parentPush = index(c => c.cwd === f.root && c.args[0] === 'push');
  const create = index(c => c.command === 'gh' && c.args[1] === 'create');
  const publish = index(c => c.command === 'gh' && c.args[1] === 'edit');
  assert.ok(build < tag && tag < parentPush && parentPush < create && create < publish);
  assert.ok(f.calls.some(c => c.args.includes('--atomic')));
});

test('rejects an existing version or dirty checkout before building', t => {
  const f = fixture(t, { dirty: true });
  assert.throws(() => releaseObsidian('1.0.7', f), /newer/);
  assert.throws(() => releaseObsidian('1.0.8', f), /Commit or stash/);
  assert.ok(!f.calls.some(c => c.command === 'pnpm'));
});

test('build failure restores versions and never tags or publishes', t => {
  const f = fixture(t, { fail: c => c.command === 'pnpm' });
  const before = readFileSync(join(f.plugin, 'manifest.json'), 'utf8');
  assert.throws(() => releaseObsidian('1.0.8', f), /Simulated failure/);
  assert.equal(readFileSync(join(f.plugin, 'manifest.json'), 'utf8'), before);
  assert.ok(!f.calls.some(c => c.args[0] === 'push' || c.args[1] === 'create'));
});

test('failed parent push prevents creating a release', t => {
  const f = fixture(t, { fail: c => c.args[0] === 'push' && !c.args.includes('--atomic') });
  assert.throws(() => releaseObsidian('1.0.8', f), /Simulated failure/);
  assert.equal(JSON.parse(readFileSync(join(f.plugin, 'manifest.json'))).version, '1.0.8');
  assert.ok(!f.calls.some(c => c.args[1] === 'create'));
});

test('failed upload or incorrect attachment keeps release unpublished', t => {
  for (const options of [{ fail: c => c.command === 'gh' && c.args[1] === 'upload' }, { wrongAsset: true }, { badDigest: true }]) {
    const f = fixture(t, options);
    assert.throws(() => releaseObsidian('1.0.8', f));
    assert.ok(!f.calls.some(c => c.command === 'gh' && c.args[1] === 'edit'));
  }
});

test('resume continues after version commit without bumping or committing it again', t => {
  const f = fixture(t, { resume: true, existingRelease: true });
  releaseObsidian('1.0.8', { ...f, resume: true });
  assert.ok(!f.calls.some(c => c.cwd === f.plugin && c.args[0] === 'commit'));
  assert.ok(!f.calls.some(c => c.command === 'gh' && c.args[1] === 'create'));
  assert.ok(f.calls.some(c => c.command === 'gh' && c.args[1] === 'edit'));
});

test('existing release or tag is rejected before version files change', t => {
  for (const options of [{ existingRelease: true }, { remoteTag: 'abc\trefs/tags/1.0.8' }]) {
    const f = fixture(t, options);
    assert.throws(() => releaseObsidian('1.0.8', f), /already exists/);
    assert.equal(JSON.parse(readFileSync(join(f.plugin, 'package.json'))).version, '1.0.7');
    assert.ok(!f.calls.some(c => c.command === 'pnpm'));
  }
});

test('resume rejects a conflicting remote tag before building', t => {
  const f = fixture(t, { resume: true, remoteTag: 'different\trefs/tags/1.0.8' });
  assert.throws(() => releaseObsidian('1.0.8', { ...f, resume: true }), /different commit/);
  assert.ok(!f.calls.some(c => c.command === 'pnpm'));
});

test('resume fetches an existing annotated tag instead of recreating it', t => {
  const f = fixture(t, { resume: true, remoteTag: 'tag-object\trefs/tags/1.0.8\nabc\trefs/tags/1.0.8^{}' });
  releaseObsidian('1.0.8', { ...f, resume: true });
  assert.ok(f.calls.some(c => c.args.join(' ') === 'fetch origin tag 1.0.8'));
  assert.ok(!f.calls.some(c => c.args[0] === 'tag' && c.args[1] === '-a'));
});

test('resume verifies a public release without uploading or editing it', t => {
  const f = fixture(t, { resume: true, existingRelease: true, publicRelease: true });
  releaseObsidian('1.0.8', { ...f, resume: true });
  assert.ok(!f.calls.some(c => c.command === 'gh' && ['create', 'upload', 'edit'].includes(c.args[1])));
});
