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

const datasourceProviderNormalized = {
  sqlite: 'sqlite',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
} as const

export const DatasourceProviderNormalized = z.nativeEnum(datasourceProviderNormalized)

export type DatasourceProviderNormalized = z.infer<typeof DatasourceProviderNormalized>

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
 * @see https://regex101.com/r/LpShvf/5
 */
const datasourceBlockPattern = /^(?!\/\/)\s*(datasource\s+([^{\s]+)\s*{(?:\s|[^}])*})/gm

/**
 * This expression is safe to use on match group 1 from {@link datasourceBlockPattern}.
 */
const datasourceBlockFieldProviderPattern = new RegExp(
  `^\\s*provider\\s*=\\s*"(${Object.values(DatasourceProviderInput._def.values).join('|')})"`,
  'gm'
)

/**
 * This pattern is safe to use on match group 1 from {@link datasourceBlockPattern}.
 *
 * @see https://regex101.com/r/Cv6qth/2
 */
const datasourceBlockFieldUrlPattern = /^\s*url\s*=\s*([^\n]+)\s*$/gm

/**
 * This pattern is safe to use on match group 1 from {@link datasourceBlockFieldUrlPattern}.
 *
 * @see https://regex101.com/r/TmEuzw/2
 */
const datasourceBlockFieldUrlEnvPattern = /env\(\s*"([^"]+)"\s*\)/

/**
 * This pattern is safe to use on match group 1 from {@link datasourceBlockFieldUrlPattern}.
 *
 * @see https://regex101.com/r/OQTF4m/3
 */
const datasourceBlockFieldUrlLiteralPattern = /"([^"]+)"/

/**
 * Parse the datasource url from the Prisma schema.
 *
 * Throws if no valid datasource block is found
 * Throws if multiple valid datasource url blocks are found.
 */
export const parseDatasourceOrThrow = (schema: string): ParsedDatasource => {
  const blockResults = Array.from(schema.matchAll(datasourceBlockPattern))
  if (blockResults.length === 0) {
    throw new Error(`Failed to parse datasource: No datasource block found.`)
  }
  if (blockResults.length > 1) {
    throw new Error(`Failed to parse datasource: Multiple datasource blocks found.`)
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const blockResult = blockResults[0]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const blockCode = blockResult[1]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const blockName = blockResult[2]!

  const fieldProviderResults = Array.from(blockCode.matchAll(datasourceBlockFieldProviderPattern))
  if (fieldProviderResults.length === 0) {
    throw new Error(`Failed to parse datasource: No valid provder property set.`)
  }
  if (fieldProviderResults.length > 1) {
    throw new Error(`Failed to parse datasource: Multiple provder properties set.`)
  }
  // @ts-expect-error The regexp guarantees that this string is "parsed" into an expected value.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const provider = normalizeDatasourceProvider(fieldProviderResults[0]![1]!)

  const fieldUrlResults = Array.from(blockCode.matchAll(datasourceBlockFieldUrlPattern))
  if (fieldUrlResults.length === 0) {
    throw new Error(
      `Failed to parse datasource: No url property found:\n\nPattern:\n${String(
        datasourceBlockFieldUrlPattern
      )}\n\nCode:\n${blockCode}`
    )
  }
  if (fieldUrlResults.length > 1) {
    throw new Error(`Failed to parse datasource: Multiple url properties found.`)
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
  const urlValue = fieldUrlResults[0]![1]!

  const urlEnvResult = urlValue.match(datasourceBlockFieldUrlEnvPattern)
  if (urlEnvResult) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
    const environmentVariableName = urlEnvResult[1]!
    return {
      _tag: 'ParsedDatasourceUrlEnvironmentVariable',
      environmentVariableName,
      name: blockName,
      provider: provider,
      sources: {
        url: urlValue,
      },
    }
  }

  const urlLiteralResult = urlValue.match(datasourceBlockFieldUrlLiteralPattern)
  if (urlLiteralResult) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
    const connectionString = urlLiteralResult[1]!
    return {
      _tag: 'ParsedDatasourceUrlInline',
      connectionString,
      name: blockName,
      provider: provider,
      sources: {
        url: urlValue,
      },
    }
  }

  // This is impossible because group1 match to begin with necessitates that either the env or inline pattern is present.
  throw new Error(`Failed to parse datasource url property: ${urlValue}`)
}

/**
 * @returns File contents with replaced datasource. File path and content parameters do not need to match.
 */
export const setDatasourceProvider: SchemaTransformer<{ value: DatasourceProviderInput }> = (
  params
): string => {
  return replaceContent({
    content: params.prismaSchemaContent,
    pattern: datasourceBlockFieldProviderPattern,
    replacement: `provider = "${params.value}"`,
  })
}

/**
 * Change the datasource block url field value.
 *
 * Use the `environmentVariable` parameter to control if the value is set as
 * environment variable name or an inline connection string.
 *
 * By default the value is set as an inline connection string.
 *
 * No validation is performed on the value. So invalid connection strings will be permitted for example.
 *
 * @throws If the given schema has no valid datasource block.
 * @throws If the given schema has multiple valid datasource blocks.
 *
 * @example
 *
 * ```ts
 * const prismaSchemaContent = `
 *   datasource db {
 *     url = "postgres://user:pass@localhost:5432/db"
 *   }
 * `
 * setDatasourceUrlOrThrow({
 *   environmentVariable: true,
 *   value: 'DB_URL',
 *   prismaSchemaContent,
 * }) // ->
 *    // datasource db {
 *    //   url = env("DB_URL")
 *    // }
 *
 * setDatasourceUrlOrThrow({
 *   value: 'foobar',
 *   prismaSchemaContent,
 * }) // ->
 *    // datasource db {
 *    //   url = "foobar"
 *    // }
 * ```
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
