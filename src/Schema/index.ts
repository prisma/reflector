import { getDMMF } from '@prisma/sdk'
import { replaceContent } from '~/lib/helpers'
import endent from 'endent'
import { z } from 'zod'

export type DMMFDocument = Awaited<ReturnType<typeof getDMMF>>

const providerTypeInput = {
  sqlite: 'sqlite',
  postgresql: 'postgresql',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
} as const

export const ProviderTypeInput = z.nativeEnum(providerTypeInput)

export type ProviderTypeInput = z.infer<typeof ProviderTypeInput>

const providerTypeNormalized = {
  sqlite: 'sqlite',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
} as const

export const ProviderTypeNormalized = z.nativeEnum(providerTypeNormalized)

export type ProviderTypeNormalized = z.infer<typeof ProviderTypeNormalized>

const providerTypeInputNormalizedMapping: Record<ProviderTypeInput, ProviderTypeNormalized> = {
  sqlite: 'sqlite',
  postgresql: 'postgres',
  postgres: 'postgres',
  mysql: 'mysql',
  sqlserver: 'sqlserver',
  mongodb: 'mongodb',
}

const normalizeProviderType = (a: ProviderTypeInput): ProviderTypeNormalized => {
  return providerTypeInputNormalizedMapping[a]
}

// TODO remove prismaDataProxy?
export type PrismaDatabaseTypeNormalized =
  | 'sqlite'
  | 'postgresql'
  | 'mysql'
  | 'sqlserver'
  | 'prismaDataProxy'
  | 'mongodb'

export const createEmpty = ({
  database,
  previewFlags,
}: {
  /**
   * Enable preview feature flags. If any are enabled then a client generator block gets added to the empty PSL.
   * Otherwise no client generator block appears.
   *
   * @defaultValue //  All false.
   */
  previewFlags?: {
    mongoDb: boolean
  }
  database: {
    type: ProviderTypeInput
    url: string
  }
}) => {
  const previewFlagsEnabled = Object.entries(previewFlags ?? {})
    .filter(([_, enabled]) => enabled)
    .map(([previewFlag]) => previewFlag)

  const datasource = endent`
    datasource db {
      provider = ${prismaValue(database.type)}
      url      = ${prismaValue(database.url)}
    }
  `

  const generatorClient =
    previewFlagsEnabled.length > 0
      ? endent`
          generator client {
            provider        = "prisma-client-js"
            previewFeatures = [${previewFlagsEnabled.map((_) => `"${_}"`).join(', ')}]
          }
        `
      : ``
  return `${datasource}\n${generatorClient}`.trim()
}

const prismaValue = (value: string): string => {
  if (value.startsWith('env(')) return value
  return `"${value}"`
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
export const setSchemaDatasourceUrlToEnvironmentVariableNameOrThrow = (
  schema: string,
  environmentVariableName: string
): string => {
  const result = parseDatasourceOrThrow(schema)
  return schema.replace(result.sources.url, `env("${environmentVariableName}")`)
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
      provider: ProviderTypeNormalized
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
      provider: ProviderTypeNormalized
      environmentVariableName: string
    }

/**
 * Note this pattern relies on negative lookbehind which regexp 101 does not support. Therefore there is no link to it for this complex pattern. Look at test suite.
 */
const datasourceUrlInBlockPattern =
  /datasource\s+([^{\s]+)\s*{[^{]*(?<!\/\/.*)url\s*=\s*("[^"]+"|env\(\s*"[^"]+"\s*\))[^}]*}/g

const datasourceUrlEnvPattern = /env\(\s*"(.+)"\s*\)/

const datasourceProviderPattern = new RegExp(
  `^\\s*provider\\s*=\\s*"(${Object.values(ProviderTypeInput._def.values).join('|')})"`,
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
  const providerType = normalizeProviderType(matchResultProviderType[1]!)

  const environmentVariableName = group2.match(datasourceUrlEnvPattern)?.[1]
  if (environmentVariableName) {
    return {
      _tag: 'ParsedDatasourceUrlEnvironmentVariable',
      environmentVariableName,
      name: group1,
      provider: providerType,
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
      provider: providerType,
      sources: {
        url: group2,
      },
    }
  }

  // This is impossible because group1 match to begin with necessitates that either the env or inline pattern is present.
  throw new Error(`Failed to parse datasource url value: ${group2}`)
}

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const ReferentialIntegritySettingValue = {
  prisma: 'prisma',
  foreignKeys: 'foreignKeys',
} as const

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export type ReferentialIntegritySettingValue = keyof typeof ReferentialIntegritySettingValue

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const referentialIntegritySettingValueDefault = ReferentialIntegritySettingValue.foreignKeys

export const PreviewFlag = {
  mongoDb: 'mongoDb',
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-3-enable-the-feature-flag-in-the-prisma-schema-file
   */
  dataProxy: 'dataProxy',
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
   */
  referentialIntegrity: 'referentialIntegrity',
} as const

export const previewFeaturesPattern = /previewFeatures *= *\[([^\]]+)\]/

export type PreviewFlag = keyof typeof PreviewFlag

export const addPreviewFlag = (params: { prismaSchemaContent: string; previewFlag: PreviewFlag }) => {
  const existingPreviewFeatures = params.prismaSchemaContent.match(previewFeaturesPattern)
  if (existingPreviewFeatures) {
    // If the preview flag is already present then return the schema content as is.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
    if (existingPreviewFeatures[1]!.includes(PreviewFlag[params.previewFlag])) {
      return params.prismaSchemaContent
    }
    // Add the preview flag to the existing preview features field.
    return replaceContent({
      content: params.prismaSchemaContent,
      pattern: /previewFeatures(.*)=(.*)\[(.+)]/,
      replacement: `previewFeatures$1=$2[$3, "${params.previewFlag}"]`,
    })
  } else {
    // Add the preview flag to a newly added preview features field.
    return replaceContent({
      content: params.prismaSchemaContent,
      pattern: /(provider *= *"prisma-client-js")/,
      replacement: `$1\n  previewFeatures = ["${params.previewFlag}"]`,
    })
  }
}

export const setReferentialIntegrity = (params: {
  prismaSchemaContent: string
  value: ReferentialIntegritySettingValue
}) => {
  return replaceContent({
    content: params.prismaSchemaContent,
    pattern: /(url *= *env\(".+"\))/,
    replacement: `$1\n  referentialIntegrity = "${params.value}"`,
  })
}
