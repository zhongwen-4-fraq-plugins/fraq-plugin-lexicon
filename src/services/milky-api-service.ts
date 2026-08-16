import type { ApiEndpointName } from '@fraqjs/fraq';

import type { ApiActionContext } from '../actions/api-action-registry';
import { createApiEventDefaults } from '../data/api-event-defaults';
import { isMilkyApiEndpoint, MILKY_API_DEFINITIONS } from '../data/milky-api-definitions';
import { MILKY_API_NUMBER_RANGES } from '../data/milky-api-number-ranges';
import { MILKY_API_PARAMETER_VALUES } from '../data/milky-api-parameter-values';
import { LexiconError } from '../errors';
import type { ApiParameterDefinition, ApiParameterKind } from '../models/milky-api';
import { normalizeApiParameters } from '../parsers/api-parameter-parser';
import { escapeTemplateText } from '../parsers/template-parser';

export class MilkyApiService {
  async execute(endpointName: string, parameters: Record<string, string>, context: ApiActionContext): Promise<string> {
    if (!isMilkyApiEndpoint(endpointName)) {
      throw new LexiconError(`不支持的 Milky API：${endpointName}。`);
    }

    const definition = MILKY_API_DEFINITIONS[endpointName];
    const normalizedParameters = normalizeApiParameters(parameters, definition);
    const unknownParameter = Object.keys(normalizedParameters).find((name) => !(name in definition));
    if (unknownParameter) {
      throw new LexiconError(`Milky API“${endpointName}”不支持参数“${unknownParameter}”。`);
    }

    const eventDefaults = createApiEventDefaults(context.message);
    const apiParameters: Record<string, unknown> = {};
    const missingParameters: string[] = [];
    for (const [name, parameterDefinition] of Object.entries(definition)) {
      const explicitValue = normalizedParameters[name];
      if (explicitValue !== undefined) {
        apiParameters[name] = parseParameterValue(explicitValue, parameterDefinition, endpointName, name);
        continue;
      }
      if (Object.hasOwn(eventDefaults, name)) {
        apiParameters[name] = eventDefaults[name];
        continue;
      }
      if (!isOptionalParameter(parameterDefinition)) {
        missingParameters.push(name);
      }
    }

    if (missingParameters.length > 0) {
      throw new LexiconError(`Milky API“${endpointName}”缺少必填参数：${missingParameters.join('、')}。`);
    }

    validateNumberRanges(endpointName, apiParameters);

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

function parseParameterValue(
  value: string,
  definition: ApiParameterDefinition,
  endpoint: ApiEndpointName,
  name: string,
): unknown {
  const kind = parameterKind(definition);
  if (kind === 'string') {
    validateStringValue(value, endpoint, name);
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

function parameterKind(definition: ApiParameterDefinition): ApiParameterKind {
  return (definition.endsWith('?') ? definition.slice(0, -1) : definition) as ApiParameterKind;
}

function isOptionalParameter(definition: ApiParameterDefinition): boolean {
  return definition.endsWith('?');
}

function validateStringValue(value: string, endpoint: ApiEndpointName, name: string): void {
  const endpointValues = MILKY_API_PARAMETER_VALUES[endpoint] as
    | Readonly<Record<string, readonly string[]>>
    | undefined;
  const allowedValues = endpointValues?.[name];
  if (allowedValues && !allowedValues.includes(value)) {
    throw new LexiconError(`参数“${name}”必须是以下值之一：${allowedValues.join('、')}。`);
  }
}

function validateNumberRanges(endpoint: ApiEndpointName, parameters: Readonly<Record<string, unknown>>): void {
  for (const [name, range] of Object.entries(MILKY_API_NUMBER_RANGES)) {
    if (!Object.hasOwn(parameters, name)) {
      continue;
    }

    const value = parameters[name];
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
      throw new LexiconError(`Milky API“${endpoint}”参数“${name}”必须是安全整数。`);
    }
    if (value < range.minimum || value > range.maximum) {
      throw new LexiconError(
        `Milky API“${endpoint}”参数“${name}”必须是 ${range.minimum} 到 ${range.maximum} 之间的整数。`,
      );
    }
  }
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
