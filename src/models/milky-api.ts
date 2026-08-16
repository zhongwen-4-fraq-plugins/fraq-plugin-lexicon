import type { ApiEndpointName, ApiParams } from '@fraqjs/fraq';

export type ApiParameterKind = 'boolean' | 'message' | 'number' | 'string';

export type MilkyApiDefinition = Readonly<Record<string, ApiParameterKind>>;

type ApiParameterKindOf<Value> =
  NonNullable<Value> extends number
    ? 'number'
    : NonNullable<Value> extends boolean
      ? 'boolean'
      : NonNullable<Value> extends string
        ? 'string'
        : NonNullable<Value> extends readonly unknown[]
          ? 'message'
          : never;

export type MilkyApiDefinitions = Readonly<{
  [Endpoint in ApiEndpointName]: Readonly<{
    [Name in keyof NonNullable<ApiParams<Endpoint>>]-?: ApiParameterKindOf<NonNullable<ApiParams<Endpoint>>[Name]>;
  }>;
}>;
