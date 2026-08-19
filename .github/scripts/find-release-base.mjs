import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const WORKFLOW_FILE = 'publish.yml';

export async function findReleaseBase(candidates, loadRuns) {
  const failedTags = [];
  for (const candidate of candidates) {
    const runs = await loadRuns(candidate.tag);
    const run = runs
      .filter((item) => item.head_branch === candidate.tag && item.head_sha === candidate.sha)
      .sort((left, right) => right.id - left.id)[0];
    if (run?.conclusion === 'success') {
      return { baseTag: candidate.tag, failedTags };
    }
    failedTags.push(candidate.tag);
  }
  return { baseTag: '', failedTags };
}

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }).trim();
}

function previousVersionTags(currentTag) {
  return runGit(['tag', '--merged', currentTag, '--sort=-v:refname'])
    .split(/\r?\n/u)
    .filter((tag) => tag && tag !== currentTag && /^v?\d/u.test(tag))
    .map((tag) => ({ tag, sha: runGit(['rev-list', '-n', '1', tag]) }));
}

async function loadWorkflowRuns(repository, token, tag) {
  const url = new URL(`https://api.github.com/repos/${repository}/actions/workflows/${WORKFLOW_FILE}/runs`);
  url.searchParams.set('branch', tag);
  url.searchParams.set('event', 'push');
  url.searchParams.set('per_page', '100');
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'fraq-plugin-lexicon-release',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`查询标签“${tag}”的发布工作流失败：HTTP ${response.status}。`);
  }
  const data = await response.json();
  return Array.isArray(data.workflow_runs) ? data.workflow_runs : [];
}

async function main() {
  const currentTag = process.argv[2];
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  if (!currentTag || !repository || !token) {
    throw new Error('缺少当前标签、GITHUB_REPOSITORY 或 GH_TOKEN。');
  }

  runGit(['rev-parse', '--verify', `refs/tags/${currentTag}`]);
  const result = await findReleaseBase(previousVersionTags(currentTag), (tag) =>
    loadWorkflowRuns(repository, token, tag),
  );
  if (result.failedTags.length > 0) {
    console.error(`以下标签没有成功完成发布工作流，将合并其更新日志：${result.failedTags.join('、')}`);
  }
  if (result.baseTag) {
    console.error(`发布说明从最近成功发布的标签 ${result.baseTag} 开始统计。`);
  } else {
    console.error('没有找到成功发布的历史标签，发布说明将统计当前标签的全部可达提交。');
  }
  process.stdout.write(result.baseTag);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
