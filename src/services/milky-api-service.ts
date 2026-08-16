import type { ApiEndpointName } from '@fraqjs/fraq';

import type { ApiActionContext } from '../actions/api-action-registry';
import { createApiEventDefaults } from '../data/api-event-defaults';
import { isMilkyApiEndpoint, MILKY_API_DEFINITIONS } from '../data/milky-api-definitions';
import { LexiconError } from '../errors';
import type { ApiParameterKind } from '../models/milky-api';
import { escapeTemplateText } from '../parsers/template-parser';

export class MilkyApiService {
  async execute(endpointName: string, parameters: Record<string, string>, context: ApiActionContext): Promise<string> {
    if (!isMilkyApiEndpoint(endpointName)) {
      throw new LexiconError(`不支持的 Milky API：${endpointName}。`);
    }

    const definition = MILKY_API_DEFINITIONS[endpointName];
    const unknownParameter = Object.keys(parameters).find((name) => !(name in definition));
    if (unknownParameter) {
      throw new LexiconError(`Milky API“${endpointName}”不支持参数“${unknownParameter}”。`);
    }

    const eventDefaults = createApiEventDefaults(context.message);
    const apiParameters: Record<string, unknown> = {};
    for (const [name, kind] of Object.entries(definition)) {
      const explicitValue = parameters[name];
      if (explicitValue !== undefined) {
        apiParameters[name] = parseParameterValue(explicitValue, kind, name);
        continue;
      }
      if (Object.hasOwn(eventDefaults, name)) {
        apiParameters[name] = eventDefaults[name];
      }
    }

    try {
      const result = await callApi(context, endpointName, apiParameters);
      return serializeApiResult(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LexiconError(`Milky API“${endpointName}”执行失败：${message}`);
    }
  }
}

async function callApi(
  context: ApiActionContext,
  endpoint: ApiEndpointName,
  parameters: Record<string, unknown>,
): Promise<unknown> {
  const method = Reflect.get(context.client, endpoint) as unknown;
  if (typeof method !== 'function') {
    throw new Error(`当前 Milky 客户端没有实现 ${endpoint}`);
  }
  return method.call(context.client, parameters);
}

function parseParameterValue(value: string, kind: ApiParameterKind, name: string): unknown {
  if (kind === 'string') {
    return value;
  }
  if (kind === 'number') {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new LexiconError(`参数“${name}”必须是安全整数。`);
    }
    return parsed;
  }
  if (kind === 'boolean') {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    throw new LexiconError(`参数“${name}”必须是 true 或 false。`);
  }
  return parseMessage(value, name);
}

function parseMessage(value: string, name: string): unknown[] {
  const trimmedValue = value.trim();
  if (!trimmedValue.startsWith('[') && !trimmedValue.startsWith('{')) {
    return [{ type: 'text', data: { text: value } }];
  }

  try {
    const parsed = JSON.parse(trimmedValue) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new LexiconError(`参数“${name}”不是有效的消息 JSON：${message}`);
  }
}

function serializeApiResult(result: unknown): string {
  if (result === undefined || result === null) {
    return '';
  }
  if (typeof result === 'string') {
    return escapeTemplateText(result);
  }
  if (typeof result === 'number' || typeof result === 'boolean') {
    return String(result);
  }
  if (isEmptyObject(result)) {
    return '';
  }
  return escapeTemplateText(JSON.stringify(result));
}

function isEmptyObject(value: unknown): boolean {
  return typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0;
}
