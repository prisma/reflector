import { SomeDatasourceRecord, SomeModel } from './model'
import * as Remeda from 'remeda'
import { z } from 'zod'

const operationRawNamesEnum = {
  $executeRaw: '$executeRaw',
  $queryRaw: '$queryRaw',
  $executeRawUnsafe: '$executeRawUnsafe',
  $queryRawUnsafe: '$queryRawUnsafe',
} as const

const OperationRawNames = z.nativeEnum(operationRawNamesEnum)

export type OperationRawName = z.infer<typeof OperationRawNames>

const operationModelNamesEnum = {
  create: 'create',
  createMany: 'createMany',
  findMany: 'findMany',
  findUnique: 'findUnique',
  findFirst: 'findFirst',
  update: 'update',
  updateMany: 'updateMany',
  upsert: 'upsert',
  delete: 'delete',
  deleteMany: 'deleteMany',
  aggregate: 'aggregate',
  groupBy: 'groupBy',
  count: 'count',
} as const

const OperationModelName = z.nativeEnum(operationModelNamesEnum)

export type OperationModelName = z.infer<typeof OperationModelName>

export const operationModelReadOnlyEnum = Remeda.pick(operationModelNamesEnum, [
  'findMany',
  'findUnique',
  'findFirst',
  'aggregate',
  'groupBy',
  'count',
])

export const OperationModelReadOnly = z.nativeEnum(operationModelReadOnlyEnum)

export type OperationModelReadOnly = z.infer<typeof OperationModelReadOnly>

export interface OperationRawInfo<DatasourceRecord extends SomeDatasourceRecord = SomeDatasourceRecord> {
  $queryRaw: {
    output: DatasourceRecord[]
  }
  $queryRawUnsafe: {
    output: DatasourceRecord[]
  }
  $executeRaw: {
    output: number
  }
  $executeRawUnsafe: {
    output: number
  }
}

export type OperationRawOutput = OperationRawInfo[keyof OperationRawInfo]['output']

export interface OperationModelInfo<Model extends SomeModel = SomeModel> {
  count: {
    output: number
  }
  findUnique: {
    output: null | Model
  }
  findFirst: {
    output: null | Model
  }
  findMany: {
    output: Model[]
  }
  create: {
    output: Model
  }
  createMany: {
    output: { count: number }
  }
  update: {
    output: Model
  }
  updateMany: {
    output: Model[]
  }
  upsert: {
    output: Model
  }
  delete: {
    output: Model
  }
  deleteMany: {
    output: Model[]
  }
  aggregate: {
    output: {
      _avg?: Record<string, null | number>
      _count?: Record<string, number>
    }
  }
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/aggregation-grouping-summarizing#group-by
   */
  groupBy: {
    output: (Partial<Model> & { _sum: Record<string, number> })[]
  }
}

export type OperationModelOutput = OperationModelInfo[keyof OperationModelInfo]['output']
