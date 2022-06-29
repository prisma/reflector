import { getDMMF } from '@prisma/internals'

export type SchemaTransformer<Parameters extends Record<string, unknown>> = (
  params: { prismaSchemaContent: string } & Parameters
) => string

export type DMMFDocument = Awaited<ReturnType<typeof getDMMF>>
