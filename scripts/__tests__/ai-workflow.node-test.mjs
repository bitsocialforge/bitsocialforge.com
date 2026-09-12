import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { generatedFiles, listFiles, readFrontmatter } from '../ai-workflow-files.mjs';
import { validateWorkflow } from '../validate-ai-workflow.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bitsocialforge.com-workflow-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const relative of [
    '.agents',
    '.codex/config.toml',
    '.codex/hooks.json',
    '.codex/hooks',
    '.cursor/hooks.json',
    '.cursor/hooks',
    '.claude/settings.json',
    '.claude/hooks',
    'CLAUDE.md',
  ]) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(path.join(repository, relative), target, { recursive: true });
  }
  for (const [relative, content] of generatedFiles(root)) {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return root;
}

test('shared sources generate valid, deterministic harness outputs', (t) => {
  const root = fixture(t);
  const before = generatedFiles(root);
  assert.deepEqual(generatedFiles(root), before);
  const result = validateWorkflow(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.roles, 2);
  const codexReviewer = before.get('.codex/agents/reviewer.toml');
  assert.match(codexReviewer, /name = ['"]reviewer['"]/);
  assert.doesNotMatch(codexReviewer, /(?:^|\n)model\s*=/);
  for (const harness of ['claude', 'cursor']) {
    assert.equal(readFrontmatter(before.get(`.${harness}/agents/reviewer.md`)).metadata.model, undefined);
  }
});

test('validation detects a missing agent and obsolete compatibility files', (t) => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, '.codex/agents/reviewer.toml'));
  fs.writeFileSync(path.join(root, '.cursor/agents/obsolete.md'), 'old role');
  const errors = validateWorkflow(root).errors;
  assert.ok(errors.some((error) => error.includes('reviewer.toml')));
  assert.ok(errors.some((error) => error.includes('Obsolete generated file')));
});

test('validation rejects Stop mutations even when JSON parses', (t) => {
  const root = fixture(t);
  const file = path.join(root, '.codex/hooks.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  config.hooks.Stop = [{ hooks: [{ type: 'command', command: 'git fetch --prune' }] }];
  fs.writeFileSync(file, JSON.stringify(config));
  assert.ok(validateWorkflow(root).errors.some((error) => error.includes('no Stop')));
});

test('manual invocation needs the documented Codex policy as well as Claude frontmatter', (t) => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, '.agents/skills/commit/agents/openai.yaml'));
  assert.ok(validateWorkflow(root).errors.some((error) => error.includes('Manual skill needs Codex invocation policy')));
});

test('unknown role metadata fails instead of silently changing model inheritance', (t) => {
  const root = fixture(t);
  const file = path.join(root, '.agents/roles/reviewer.md');
  const content = fs.readFileSync(file, 'utf8').replace('name: reviewer', 'name: reviewer\nmodel: undocumented-model');
  fs.writeFileSync(file, content);
  assert.throws(() => generatedFiles(root), /Unsupported role field model/);
});

test('duplicate legacy skill roots fail validation', (t) => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, '.codex/skills'));
  assert.ok(validateWorkflow(root).errors.some((error) => error.includes('Duplicate skill root')));
});

test('logical paths use forward slashes and skill assets retain their bytes', (t) => {
  const root = fixture(t);
  const relative = '.agents/skills/commit/assets/example.bin';
  const bytes = Buffer.from([0, 255, 128, 13, 10]);
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  fs.writeFileSync(path.join(root, relative), bytes);
  assert.ok(listFiles(root).includes(relative));
  const outputs = generatedFiles(root);
  assert.ok([...outputs.keys()].every((key) => !key.includes('\\')));
  assert.deepEqual(outputs.get('.claude/skills/commit/assets/example.bin'), bytes);
});

test('edit hooks and wrappers reject appended lifecycle commands', (t) => {
  const root = fixture(t);
  for (const harness of ['.codex', '.claude', '.cursor']) {
    const configPath = path.join(root, harness, harness === '.claude' ? 'settings.json' : 'hooks.json');
    const original = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(original);
    const handler = harness === '.cursor' ? config.hooks.afterFileEdit[0] : config.hooks.PostToolUse[0].hooks[0];
    handler.command += '; git fetch --prune';
    fs.writeFileSync(configPath, JSON.stringify(config));
    assert.ok(validateWorkflow(root).errors.some((error) => error.includes('only its formatter wrapper')));
    fs.writeFileSync(configPath, original);
    const wrapper = path.join(root, harness, 'hooks/format.sh');
    const originalWrapper = fs.readFileSync(wrapper, 'utf8');
    fs.appendFileSync(wrapper, '\ngit fetch --prune\n');
    assert.ok(validateWorkflow(root).errors.some((error) => error.includes('only the shared formatter invocation')));
    fs.writeFileSync(wrapper, originalWrapper);
  }
});

test('role sources reject model settings and invalid sandbox values', (t) => {
  const root = fixture(t);
  const file = path.join(root, '.agents/roles/reviewer.md');
  const original = fs.readFileSync(file, 'utf8');
  for (const key of ['model', 'model_reasoning_effort', 'claude-model', 'cursor-model']) {
    fs.writeFileSync(file, original.replace('name: reviewer', `name: reviewer\n${key}: inherit`));
    assert.throws(() => generatedFiles(root), /Unsupported role field/);
  }
  fs.writeFileSync(file, original.replace('sandbox-mode: read-only', 'sandbox-mode: false'));
  assert.throws(() => generatedFiles(root), /Unsupported role sandbox/);
});

// These fake executables record the optional vendor helper's real subprocess argv;
// no authenticated CLI, model provider, or project source is invoked.
for (const provider of ['codex', 'claude']) {
  test(`Impeccable ${provider} copy runner inherits model and permissions unless explicitly configured`, async (t) => {
    const { runCopyEditBatchAgent } = await import('../../.agents/skills/impeccable/scripts/live-copy-edit-agent.mjs');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'impeccable-runner-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const bin = path.join(root, 'bin');
    fs.mkdirSync(bin);
    const capture = path.join(root, 'argv.json');
    fs.writeFileSync(path.join(bin, provider), `#!${process.execPath}\nconst fs = require('node:fs');\nconst args = process.argv.slice(2);\nfs.writeFileSync(process.env.ARGV_OUTPUT, JSON.stringify(args));\nconst result = JSON.stringify({status:'done', appliedEntryIds:[], failed:[], files:[], notes:[]});\nconst output = args.indexOf('--output-last-message');\nif (output >= 0) fs.writeFileSync(args[output + 1], result);\nelse process.stdout.write(result);\nprocess.stdin.resume();\n`, { mode: 0o755 });
    const env = { PATH: bin, ARGV_OUTPUT: capture };
    const run = async (overrides = {}) => {
      await runCopyEditBatchAgent({ entries: [] }, { provider, cwd: root, outDir: path.join(root, 'out'), env: { ...env, ...overrides }, timeoutMs: 5000 });
      return JSON.parse(fs.readFileSync(capture, 'utf8'));
    };
    const inherited = await run();
    assert.ok(!inherited.includes('--model'));
    assert.ok(!inherited.some((arg) => arg.startsWith('model_reasoning_effort=')));
    assert.ok(!inherited.includes('--dangerously-bypass-approvals-and-sandbox'));
    assert.ok(!inherited.includes('--permission-mode'));
    const selected = await run({ IMPECCABLE_LIVE_COPY_AGENT_MODEL: 'chosen-at-runtime', IMPECCABLE_LIVE_COPY_AGENT_EFFORT: 'high' });
    assert.equal(selected[selected.indexOf('--model') + 1], 'chosen-at-runtime');
    if (provider === 'codex') assert.ok(selected.includes('model_reasoning_effort="high"'));
  });
}


test('Impeccable pinning writes only canonical sources and preserves unrelated generated skills', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'package.json'), '{}');
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.writeFileSync(path.join(root, 'scripts/sync-ai-workflow.mjs'), '// source marker');
  const generated = path.join(root, '.claude/skills/audit/SKILL.md');
  fs.mkdirSync(path.dirname(generated));
  fs.writeFileSync(generated, 'Existing unrelated skill');
  const script = path.join(root, '.agents/skills/impeccable/scripts/pin.mjs');
  for (const action of ['pin', 'unpin']) {
    const result = spawnSync(process.execPath, [script, action, 'audit'], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(root, '.agents/skills/audit')), action === 'pin');
    assert.equal(fs.readFileSync(generated, 'utf8'), 'Existing unrelated skill');
    assert.equal(fs.existsSync(path.join(root, '.cursor/skills')), false);
  }
});

test('requested Impeccable hook setup uses canonical Cursor files and preserves existing hooks', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const root = fixture(t);
  const file = path.join(root, '.cursor/hooks.json');
  const original = JSON.parse(fs.readFileSync(file, 'utf8'));
  const script = path.join(root, '.agents/skills/impeccable/scripts/hook-admin.mjs');
  const result = spawnSync(process.execPath, [script, 'on'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(config.hooks.afterFileEdit, original.hooks.afterFileEdit);
  assert.equal(config.hooks.preToolUse[0].command, 'node ".agents/skills/impeccable/scripts/hook-before-edit.mjs"');
  assert.equal(fs.existsSync(path.join(root, '.agents/skills/impeccable/scripts/hook-before-edit.mjs')), true);
});


test('explicit site verification retains asset checks without installing dependencies or requiring a dirty checkout', async (t) => {
  const { spawnSync } = await import('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-site-verify-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, content) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  };
  const script = write('scripts/verify.sh', fs.readFileSync(path.join(repository, 'scripts/verify.sh')));
  write('index.html', '<html><head><link rel="stylesheet" href="/styles.css" /></head><body></body></html>');
  write('styles.css', 'body { background: black; }');
  write('fonts/fonts.css', '@font-face { src: url(font.woff2); }');
  write('fonts/font.woff2', 'fixture');
  write('public/asset.txt', 'fixture');
  write('dist/asset.txt', 'fixture');
  const log = path.join(root, 'commands.jsonl');
  const fake = write('bin/corepack', `#!${process.execPath}\nconst fs = require('node:fs'); fs.appendFileSync(process.env.ARGV_OUTPUT, JSON.stringify(process.argv.slice(2)) + '\\n');\n`);
  fs.chmodSync(fake, 0o755);
  const env = { ...process.env, PATH: path.join(root, 'bin') + path.delimiter + process.env.PATH, ARGV_OUTPUT: log };
  const result = spawnSync('/bin/bash', [script], { cwd: root, env, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const commands = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(commands, [['yarn', 'type-check'], ['yarn', 'lint'], ['yarn', 'build']]);
  fs.unlinkSync(path.join(root, 'fonts/font.woff2'));
  const missingAsset = spawnSync('/bin/bash', [script], { cwd: root, env, encoding: 'utf8', timeout: 5000 });
  assert.equal(missingAsset.status, 1);
  assert.match(missingAsset.stdout, /url\(\) does not resolve: font.woff2/);
});
