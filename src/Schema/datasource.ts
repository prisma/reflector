/**
 * Logic related to the datasource Block.
 *
 * @see https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#datasource
 */

import { replaceContent } from '../lib/helpers'
import { createEnvValue, createValue } from './create'
import { SchemaTransformer } from './helpers'
import { z } from 'zod'

const datasourceProviderInput = {
  sqlite: 'sqlite',
  postgresql: 'postgresql',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
} as const

export const DatasourceProviderInput = z.nativeEnum(datasourceProviderInput)

export type DatasourceProviderInput = z.infer<typeof DatasourceProviderInput>

const DatasourceProviderNormalized = {
  sqlite: 'sqlite',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
} as const

export const DatasourceProviderTypeNormalized = z.nativeEnum(DatasourceProviderNormalized)

export type DatasourceProviderNormalized = z.infer<typeof DatasourceProviderTypeNormalized>

const datasourceProviderTypeInputNormalizedMapping: Record<
  DatasourceProviderInput,
  DatasourceProviderNormalized
> = {
  sqlite: 'sqlite',
  postgresql: 'postgres',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
}

const normalizeDatasourceProvider = (a: DatasourceProviderInput): DatasourceProviderNormalized => {
  return datasourceProviderTypeInputNormalizedMapping[a]
}

/**
 * Note this pattern relies on negative lookbehind which regexp 101 does not support.
 * Therefore there is no link to it for this complex pattern. Look at test suite.
 */
const datasourceUrlInBlockPattern =
  /datasource\s+([^{\s]+)\s*{[^{]*(?<!\/\/.*)url\s*=\s*("[^"]+"|env\(\s*"[^"]+"\s*\))[^}]*}/g

const datasourceUrlEnvPattern = /env\(\s*"(.+)"\s*\)/

const datasourceProviderPattern = new RegExp(
  `^\\s*provider\\s*=\\s*"(${Object.values(DatasourceProviderInput._def.values).join('|')})"`,
  'm'
)

const datasourceUrlInlinePattern = /"(.+)"/

/**
 * Parse the datasource url from the Prisma schema.
 *
 * Throws if no valid datasource block is found
 * Throws if multiple valid datasource url blocks are found.
 */
export const parseDatasourceOrThrow = (schema: string): ParsedDatasource => {
  const matchResults = Array.from(schema.matchAll(datasourceUrlInBlockPattern))

  if (matchResults.length === 0) {
    throw new Error(`Failed to parse datasource: No valid datasource block found.`)
  }

  if (matchResults.length > 1) {
    throw new Error(`Failed to parse datasource: Multiple datasource blocks found.`)
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const matchResult = matchResults[0]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const group1 = matchResult[1]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const group2 = matchResult[2]!

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const matchResultProviderType = matchResult[0]!.match(datasourceProviderPattern)

  if (!matchResultProviderType) {
    throw new Error(`Failed to parse datasource: Datasource is missing a valid provider type`)
  }

  // @ts-expect-error The regexp guarantees that this string is "parsed" into an expected value.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const provider = normalizeDatasourceProvider(matchResultProviderType[1]!)

  const environmentVariableName = group2.match(datasourceUrlEnvPattern)?.[1]
  if (environmentVariableName) {
    return {
      _tag: 'ParsedDatasourceUrlEnvironmentVariable',
      environmentVariableName,
      name: group1,
      provider: provider,
      sources: {
        url: group2,
      },
    }
  }

  const connectionString = group2.match(datasourceUrlInlinePattern)?.[1]

  if (connectionString) {
    return {
      _tag: 'ParsedDatasourceUrlInline',
      connectionString,
      name: group1,
      provider: provider,
      sources: {
        url: group2,
      },
    }
  }

  // This is impossible because group1 match to begin with necessitates that either the env or inline pattern is present.
  throw new Error(`Failed to parse datasource url value: ${group2}`)
}

/**
 * @returns File contents with replaced datasource. File path and content parameters do not need to match.
 */
export const setDatasourceProvider: SchemaTransformer<{ datasourceProvider: DatasourceProviderInput }> = (
  params
): string => {
  return replaceContent({
    content: params.prismaSchemaContent,
    pattern: datasourceProviderPattern,
    replacement: `provider = "${params.datasourceProvider}"`,
  })
}

/**
 * Change the datasource block url field value to be an environment variable reference.
 *
 * If the schema is currently using an inline url then it will be replaced with an environment variable reference.
 *
 * If the schema is currently using an environment variable reference already, then just the environment variable name being referenced will change.
 *
 * Throws if no valid datasource block is found
 * Throws if multiple valid datasource url blocks are found.
 */
export const setDatasourceUrlOrThrow: SchemaTransformer<{
  /**
   * Should the value be treated as an environment variable name?
   *
   * @defaultValue false
   */
  environmentVariable?: boolean
  value: string
}> = (params): string => {
  const result = parseDatasourceOrThrow(params.prismaSchemaContent)
  if (params.environmentVariable) {
    return params.prismaSchemaContent.replace(result.sources.url, createEnvValue(params.value))
  } else {
    return params.prismaSchemaContent.replace(result.sources.url, createValue(params.value))
  }
}

export type ParsedDatasource =
  | {
      _tag: 'ParsedDatasourceUrlInline'
      sources: {
        url: string
      }
      /**
       * The name of the block.
       */
      name: string
      provider: DatasourceProviderNormalized
      connectionString: string
    }
  | {
      _tag: 'ParsedDatasourceUrlEnvironmentVariable'
      /**
       * The source code snippet
       */
      sources: {
        url: string
      }
      /**
       * The name of the block.
       */
      name: string
      provider: DatasourceProviderNormalized
      environmentVariableName: string
    }
