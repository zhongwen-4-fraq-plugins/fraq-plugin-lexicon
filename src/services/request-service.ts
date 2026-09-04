import { LexiconError } from '../errors';

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const DEFAULT_TIMEOUT_SECONDS = 10;
const MAX_RESPONSE_BYTES = 1_048_576;

export class RequestService {
  constructor(
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly lookupImplementation: typeof lookup = lookup,
  ) {}

  async execute(
    method: string,
    rawUrl: string,
    parameters: string | undefined,
    headers: string | undefined,
    timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  ): Promise<string> {
    const url = this.parseUrl(rawUrl);
    const parameterObject = parseJsonObject(parameters, '参数');
    const headerObject = parseHeaders(headers);
    await this.assertPublicHost(url.hostname);
    if (method === 'GET' || method === 'HEAD') {
      appendSearchParameters(url, parameterObject);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.round(timeoutSeconds * 1000));
    try {
      const response = await this.fetchImplementation(url, {
        method,
        headers: headerObject,
        body:
          method === 'GET' || method === 'HEAD' || parameters === undefined
            ? undefined
            : JSON.stringify(parameterObject),
        signal: controller.signal,
        redirect: 'error',
      });
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > MAX_RESPONSE_BYTES) {
        throw new LexiconError('请求响应超过 1 MiB 限制。');
      }
      const text = new TextDecoder().decode(bytes);
      if (!response.ok) {
        throw new LexiconError(`请求返回 HTTP ${response.status}：${text.slice(0, 200)}`);
      }
      return text;
    } catch (error) {
      if (error instanceof LexiconError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LexiconError(`请求超时（${timeoutSeconds} 秒）。`);
      }
      throw new LexiconError(`请求失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private parseUrl(rawUrl: string): URL {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new LexiconError('请求 URL 无效。');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new LexiconError('请求 URL 只支持 http 和 https。');
    }
    if (url.username || url.password) {
      throw new LexiconError('请求 URL 不能包含用户名或密码。');
    }
    if (isPrivateHostname(url.hostname)) {
      throw new LexiconError('请求 URL 不允许访问本机或内网地址。');
    }
    return url;
  }

  private async assertPublicHost(hostname: string): Promise<void> {
    const normalized = hostname.replace(/^\[|\]$/g, '');
    if (isIP(normalized)) {
      if (isPrivateAddress(normalized)) {
        throw new LexiconError('请求 URL 不允许访问本机或内网地址。');
      }
      return;
    }
    try {
      const addresses = await this.lookupImplementation(normalized, { all: true, verbatim: true });
      if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
        throw new LexiconError('请求 URL 不允许访问本机或内网地址。');
      }
    } catch (error) {
      if (error instanceof LexiconError) {
        throw error;
      }
      throw new LexiconError(`解析请求域名失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function parseJsonObject(value: string | undefined, name: string): Record<string, unknown> {
  if (value === undefined || value.trim() === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new LexiconError(`请求${name}必须是有效的 JSON 对象。`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new LexiconError(`请求${name}必须是 JSON 对象。`);
  }
  return parsed as Record<string, unknown>;
}

function parseHeaders(value: string | undefined): Record<string, string> {
  const headers = parseJsonObject(value, '请求头');
  const result: Record<string, string> = {};
  for (const [name, headerValue] of Object.entries(headers)) {
    if (!name.trim() || !['string', 'number', 'boolean'].includes(typeof headerValue)) {
      throw new LexiconError('请求头的名称不能为空，值只能是字符串、数字或布尔值。');
    }
    result[name] = String(headerValue);
  }
  return result;
}

function appendSearchParameters(url: URL, parameters: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null) {
      continue;
    }
    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
}

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')) {
    return true;
  }
  return isIP(normalized) !== 0 && isPrivateAddress(normalized);
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
  const ipv4 = normalized.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/u);
  if (ipv4) {
    const [a, b] = ipv4.slice(1, 3).map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/u.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}
