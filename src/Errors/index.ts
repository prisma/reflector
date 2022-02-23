import { z } from 'zod'

/**
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const ErrorCodes = z.union([z.literal('P1003'), z.literal('P1000'), z.literal('P2002'), z.literal('P4001')])

export type ErrorCodes = z.infer<typeof ErrorCodes>

/**
 * https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const codes = {
  databaseDoesNotExistAtPath: 'P1003',
  authenticationFailed: 'P1000',
  uniqueConstraintFailed: 'P2002',
  introspectedDatabaseWasEmpty: 'P4001',
} as const
