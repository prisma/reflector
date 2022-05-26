import { pick } from 'remeda'
import { z } from 'zod'

const operationNameEnum = {
  findMany: 'findMany',
  findUnique: 'findUnique',
  deleteMany: 'deleteMany',
  findFirst: 'findFirst',
  create: 'create',
  createMany: 'createMany',
  update: 'update',
  updateMany: 'updateMany',
  upsert: 'upsert',
  delete: 'delete',
  $executeRaw: '$executeRaw',
  $queryRaw: '$queryRaw',
  $executeRawUnsafe: '$executeRawUnsafe',
  $queryRawUnsafe: '$queryRawUnsafe',
  aggregate: 'aggregate',
  groupBy: 'groupBy',
  count: 'count',
} as const

export const OperationName = z.nativeEnum(operationNameEnum)

export type OperationName = z.infer<typeof OperationName>

const readOnlyOperationNameEnum = pick(operationNameEnum, [
  'findMany',
  'findUnique',
  'findFirst',
  'aggregate',
  'groupBy',
  'count',
])

export const ReadOnlyOperationName = z.nativeEnum(readOnlyOperationNameEnum)

export type ReadOnlyOperationName = z.infer<typeof ReadOnlyOperationName>
