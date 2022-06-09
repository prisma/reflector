import { Engines, Schema } from '../index_'
import { Base64 } from '../lib/base64'
import { ClientBase, DMMF, OperationOutput, RequestInput, runRequest } from '.'
// @ts-expect-error This is a private API of the Prisma Client package.
import * as PrismaClientGenerator from '@prisma/client/generator-build'
import * as PrismaClientRuntime from '@prisma/client/runtime'
import { getDMMF } from '@prisma/sdk'
import * as Crypto from 'crypto'
import * as fs from 'fs-jetpack'
import * as Path from 'path'

export const getPrismaClient = async (params: {
  schema: {
    contents: string
    /**
     * The path to where the prisma schema file should be written to disk. When NOT using the Data Proxy then the
     * schema file will be written to this path. By default a schema.prisma file will be written to a temporary
     * directory provided by the operating system.
     */
    path?: string
  }
  connectionString: string
  useDataProxy: boolean
}): Promise<ClientBase> => {
  /**
   * About programmatically passing the connection string.
   *
   * The only way to pass to Proxy Runtime is via inlineDatasources configuration (A).
   *
   * The only way to pass to Local Runtime is via the constructor (B).
   *
   * @see https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#programmatically-override-a-datasource-url
   */
  const datasource = Schema.parseDatasourceOrThrow(params.schema.contents)
  const prismaClientDmmf = await getDmmf(params.schema.contents)
  const schemaContentsBase64 = Base64.to(params.schema.contents)
  const schemaContentsHashed = Crypto.createHash('sha256').update(schemaContentsBase64).digest('hex')
  const schemaPath = params.schema.path ?? Path.join((await fs.tmpDirAsync()).cwd(), 'schema.prisma')
  // eslint-disable-next-line
  const prismaClientVersion = require('@prisma/client').Prisma.prismaVersion.client as string
  /**
   * Currently the query engine always needs the schema on disk even if its not being used.
   *
   * @see https://github.com/prisma/prisma/issues/11599
   */
  if (!params.useDataProxy) {
    await fs.writeAsync(schemaPath, params.schema.contents)
  }
  const PrismaClient = PrismaClientRuntime.getPrismaClient({
    /**
     * (A)
     */
    dataProxy: params.useDataProxy,
    inlineDatasources: {
      [datasource.name]: {
        url: {
          fromEnvVar: null,
          value: params.connectionString,
        },
      },
    },
    inlineSchema: schemaContentsBase64,
    inlineSchemaHash: schemaContentsHashed,
    document: prismaClientDmmf,
    generator: {
      name: 'client',
      provider: {
        value: 'prisma-client-js',
        fromEnvVar: null,
      },
      config: { engineType: 'library' },
      output: null,
      binaryTargets: [],
      previewFeatures: [],
    },
    clientVersion: prismaClientVersion,
    // TODO remove this once https://github.com/prisma/prisma/issues/11599 is resolved.
    dirname: Path.dirname(schemaPath),
    activeProvider: datasource.provider,
    datasourceNames: [datasource.name],
    // TODO What are these for? SQLite-specific options? Why required then?
    relativePath: '',
    relativeEnvPaths: {
      rootEnvPath: '',
      schemaEnvPath: '',
    },
  })

  /**
   * (B)
   */
  // @ts-expect-error TODO
  return params.useDataProxy
    ? new PrismaClient()
    : new PrismaClient({
        datasources: {
          [datasource.name]: {
            url: params.connectionString,
          },
        },
      })
}

export const request = async (prisma: ClientBase, request: RequestInput): Promise<OperationOutput> => {
  try {
    await prisma.$connect()
    return runRequest(prisma, request)
  } finally {
    await prisma.$disconnect()
  }
}

export const getDmmf = async (schema: string): Promise<DMMF.Document> => {
  const libQueryFileName = await Engines.getFileName('query', 'library')
  const prismaClientGeneratedDirPath = Path.join(process.cwd(), 'node_modules/.prisma/client')
  const libQueryEnginePath = Path.join(prismaClientGeneratedDirPath, libQueryFileName)

  const genericDmmf = await getDMMF({
    datamodel: schema,
    prismaPath: libQueryEnginePath,
  })

  // eslint-disable-next-line
  const prismaClientDmmf: DMMF.Document =
    // eslint-disable-next-line
    PrismaClientGenerator.externalToInternalDmmf(genericDmmf)

  return prismaClientDmmf
}
