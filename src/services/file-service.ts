import { LexiconError } from '../errors';

import { lstat, mkdir, open, readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const FILE_MODES = {
  读取: 'r',
  读写: 'r+',
  同步读取: 'rs',
  同步读写: 'rs+',
  覆盖写入: 'w',
  独占覆盖写入: 'wx',
  覆盖读写: 'w+',
  独占覆盖读写: 'wx+',
  追加写入: 'a',
  独占追加写入: 'ax',
  追加读写: 'a+',
  独占追加读写: 'ax+',
  同步追加写入: 'as',
  同步追加读写: 'as+',
} as const;

export type FileMode = keyof typeof FILE_MODES;

export class FileService {
  constructor(private readonly rootDirectory = resolve('data')) {}

  async open(fileName: string, mode: string): Promise<string> {
    const flag = Object.hasOwn(FILE_MODES, mode) ? FILE_MODES[mode as FileMode] : undefined;
    if (!flag) {
      throw new LexiconError(`不支持的文件操作方式：“${mode}”。可用方式：${Object.keys(FILE_MODES).join('、')}。`);
    }

    try {
      const filePath = await this.resolveFilePath(fileName);
      const handle = await open(filePath, flag);
      await handle.close();
      return await readFile(filePath, 'utf8');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new LexiconError(`打开文件“${fileName}”失败：${detail}`);
    }
  }

  private async resolveFilePath(fileName: string): Promise<string> {
    if (!fileName.trim() || isAbsolute(fileName)) {
      throw new LexiconError('文件名必须是 data 目录内的相对路径。');
    }

    await mkdir(this.rootDirectory, { recursive: true });
    const root = await realpath(this.rootDirectory);
    const candidate = resolve(root, fileName);
    this.assertInsideRoot(root, candidate);

    try {
      const target = await realpath(candidate);
      this.assertInsideRoot(root, target);
      const stats = await lstat(candidate);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new LexiconError(`“${fileName}”不是普通文件。`);
      }
      return target;
    } catch (error) {
      if (error instanceof LexiconError) {
        throw error;
      }
      if (!isMissingPathError(error)) {
        throw error;
      }

      const parent = await realpath(dirname(candidate));
      this.assertInsideRoot(root, parent);
      return candidate;
    }
  }

  private assertInsideRoot(root: string, target: string): void {
    const relativePath = relative(root, target);
    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
      isAbsolute(relativePath)
    ) {
      throw new LexiconError('文件路径不能超出 data 目录。');
    }
  }
}

function isMissingPathError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
