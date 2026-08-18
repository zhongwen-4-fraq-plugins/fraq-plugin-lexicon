import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SECTIONS = [
  { key: 'features', heading: '## :sparkles:新增', prefixes: [/^✨\s*/u, /^:sparkles:\s*/u] },
  { key: 'fixes', heading: '## :bug: 修复', prefixes: [/^🐛\s*/u, /^:bug:\s*/u] },
  { key: 'improvements', heading: '## :art: 优化', prefixes: [/^🎨\s*/u, /^:art:\s*/u] },
  {
    key: 'docs',
    heading: '## :pencil: 文档',
    prefixes: [/^📝\s*/u, /^✏️?\s*/u, /^:pencil:\s*/u, /^:memo:\s*/u],
  },
];
const BOOKMARK_PREFIXES = [/^🔖\s*/u, /^:bookmark:\s*/u];

export function buildReleaseNotes(commits) {
  const buckets = new Map(SECTIONS.map((section) => [section.key, []]));
  const other = [];
  let latestBookmark;

  for (const [order, commit] of commits.entries()) {
    const bookmarkPrefix = findPrefix(commit.subject, BOOKMARK_PREFIXES);
    if (bookmarkPrefix) {
      latestBookmark ??= { order, text: stripPrefix(commit.subject, bookmarkPrefix) };
      continue;
    }

    const section = SECTIONS.find((candidate) => findPrefix(commit.subject, candidate.prefixes));
    if (!section) {
      other.push({ order, text: commit.subject.trim() });
      continue;
    }
    if (section.key === 'docs' && isFlightdeckOnly(commit.files)) {
      continue;
    }
    const prefix = findPrefix(commit.subject, section.prefixes);
    buckets.get(section.key).push({ order, text: stripPrefix(commit.subject, prefix) });
  }

  if (latestBookmark) {
    other.push(latestBookmark);
  }
  other.sort((left, right) => left.order - right.order);

  const output = [];
  for (const section of SECTIONS) {
    const items = buckets.get(section.key);
    if (items.length > 0) {
      output.push(formatSection(section.heading, items));
    }
  }
  if (other.length > 0) {
    output.push(formatSection('## 其他：', other));
  }
  return `${output.join('\n\n') || '本版本没有需要展示的提交记录。'}\n`;
}

export function isFlightdeckOnly(files) {
  return files.length > 0 && files.every((file) => file === 'flightdeck' || file.startsWith('flightdeck/'));
}

function formatSection(heading, items) {
  return [heading, '', ...items.map((item) => `- ${item.text}`)].join('\n');
}

function findPrefix(subject, prefixes) {
  return prefixes.find((prefix) => prefix.test(subject));
}

function stripPrefix(subject, prefix) {
  const text = subject.replace(prefix, '').trim();
  return text || subject.trim();
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
}

function previousTag(currentTag) {
  return runGit(['tag', '--merged', currentTag, '--sort=-v:refname'])
    .split(/\r?\n/u)
    .find((tag) => tag && tag !== currentTag && /^v?\d/u.test(tag));
}

function commitFiles(hash) {
  const output = runGit(['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', hash]);
  return output ? output.split(/\r?\n/u) : [];
}

function collectCommits(currentTag) {
  runGit(['rev-parse', '--verify', `refs/tags/${currentTag}`]);
  const previous = previousTag(currentTag);
  const range = previous ? `${previous}..${currentTag}` : currentTag;
  const output = runGit(['log', '--format=%H%x1f%s%x1e', range]);
  if (!output) {
    return [];
  }
  return output
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject] = record.split('\x1f');
      return { subject, files: commitFiles(hash) };
    });
}

function main() {
  const currentTag = process.argv[2];
  if (!currentTag) {
    throw new Error('用法：node generate-release-notes.mjs <tag>');
  }
  process.stdout.write(buildReleaseNotes(collectCommits(currentTag)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
