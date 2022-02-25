import { DatasourceProviderInput } from './datasource'
import endent from 'endent'

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
    type: DatasourceProviderInput
    url: string
  }
}) => {
  const previewFlagsEnabled = Object.entries(previewFlags ?? {})
    .filter(([_, enabled]) => enabled)
    .map(([previewFlag]) => previewFlag)

  const datasource = endent`
    datasource db {
      provider = ${createValue(database.type)}
      url      = ${createValue(database.url)}
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

/**
 * Build a prisma value suitable for the left hand side of an `=` in prisma schema.
 */
export const createValue = (value: string): string => {
  if (value.startsWith('env(')) return value
  return `"${value}"`
}

export const createEnvValue = (environmentVariableName: string): string => {
  return `env("${environmentVariableName}")`
}
