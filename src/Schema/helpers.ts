import { getDMMF } from '@prisma/sdk'

export type SchemaTransformer<Parameters extends Record<string, unknown>> = (
  params: { prismaSchemaContent: string } & Parameters
) => string

export type DMMFDocument = Awaited<ReturnType<typeof getDMMF>>
