/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-5-generate-the-client
 */
export const prismaClientEngineTypeEnvironmentVariableName = `PRISMA_CLIENT_ENGINE_TYPE`

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-5-generate-the-client
 */
export type PrismaClientEngineType = 'dataproxy'

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-5-generate-the-client
 */
export const PrismaClientEngineTypeEnum = {
  dataproxy: `dataproxy`,
} as const
