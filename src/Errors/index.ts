import { z } from 'zod'

/**
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
 */
export const code = {
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#common
   */
  common: {
    authenticationFailed: 'P1000',
    cannotReachDatabaseServer: 'P1001',
    databaseServerTimedOut: 'P1002',
    databaseDoesNotExistAtPath: 'P1003',
    operationTimedOut: 'P1008',
    databaseAlreadyExists: 'P1009',
    databaseUserDeniedAccess: 'P1010',
    failedToOpenTLSConnection: 'P1011',
    problemWithPrismaSchemaEvaluation: 'P1012',
    invalidDatabaseString: 'P1013',
    underlyingKindForModelDoesNotExist: 'P1014',
    prismaSchemaUsingFeaturesNotSupportedByCurrentDatabaseVersion: 'P1015',
    invalidRawQueryParameterCount: 'P1016',
    databaseServerClosedTheConnection: 'P1017',
  },
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
   */
  queryEngine: {
    valueExceedsColumnLength: `P2000`,
    whereConditionRecordIsMissing: `P2001`,
    uniqueConstraintFailed: 'P2002',
    //... TODO more
  },
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-migrate-migration-engine
   */
  migrateEngine: {
    databaseCreateFailed: 'P3000',
    //... TODO more
  },
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-db-pull-introspection-engine
   */
  introspectionEngine: {
    failedToCreatePrisaSchemaFile: 'P4000',
    introspectedDatabaseWasEmpty: 'P4001',
    inconsistentSchema: 'P4002',
  },
  dataProxy: {
    dataProxyUnauthorized: 'P5007',
  },
}

export const codes = {
  ...code.common,
  ...code.queryEngine,
  ...code.migrateEngine,
  ...code.introspectionEngine,
  ...code.dataProxy,
}

/**
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const ErrorCodes = z.nativeEnum(codes)

export type ErrorCodes = z.infer<typeof ErrorCodes>
