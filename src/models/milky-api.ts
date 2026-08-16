import type { ApiEndpointName, ApiParams } from '@fraqjs/fraq';

export type ApiParameterKind = 'boolean' | 'message' | 'number' | 'string';

export type ApiParameterDefinition = ApiParameterKind | `${ApiParameterKind}?`;

export type MilkyApiDefinition = Readonly<Record<string, ApiParameterDefinition>>;

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
    [Name in keyof NonNullable<ApiParams<Endpoint>>]-?: undefined extends NonNullable<ApiParams<Endpoint>>[Name]
      ? `${ApiParameterKindOf<NonNullable<ApiParams<Endpoint>>[Name]>}?`
      : ApiParameterKindOf<NonNullable<ApiParams<Endpoint>>[Name]>;
  }>;
}>;

type StringParameterName<Endpoint extends ApiEndpointName> = {
  [Name in keyof NonNullable<ApiParams<Endpoint>>]: NonNullable<NonNullable<ApiParams<Endpoint>>[Name]> extends string
    ? Name
    : never;
}[keyof NonNullable<ApiParams<Endpoint>>] &
  string;

export type MilkyApiParameterValues = Readonly<
  Partial<{
    [Endpoint in ApiEndpointName]: Readonly<Partial<Record<StringParameterName<Endpoint>, readonly string[]>>>;
  }>
>;
