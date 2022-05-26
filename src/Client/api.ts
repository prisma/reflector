import { EngineEventType } from './helpers'
import { SomeDatasourceRecord, SomeModel } from './model'
import * as Remeda from 'remeda'
import { z } from 'zod'

// TODO Use this Base client once its good enough
// export type ClientBase = ReturnTypeClassInstance<ReturnType<typeof getPrismaClient>>

/**
 * Raw Operations
 * -------------------------------------------------------------------------------------------
 */

const operationRawNamesEnum = {
  $executeRaw: '$executeRaw',
  $queryRaw: '$queryRaw',
  $executeRawUnsafe: '$executeRawUnsafe',
  $queryRawUnsafe: '$queryRawUnsafe',
} as const

const OperationRawNames = z.nativeEnum(operationRawNamesEnum)

export type OperationRawName = z.infer<typeof OperationRawNames>

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

type RawApi = {
  [operation in keyof OperationRawInfo]: (
    ...args: unknown[]
  ) => Promise<OperationRawInfo[operation]['output']>
}

/**
 * Model Operations
 * -------------------------------------------------------------------------------------------
 */

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

type ModelApi = {
  [operation in keyof OperationModelInfo]: (
    input: unknown
  ) => Promise<OperationModelInfo[operation]['output']>
}

/**
 * Other Methods
 * -------------------------------------------------------------------------------------------
 */

export interface OperationOtherInfo {
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#transaction
   */
  $transaction: {
    input: [promises: Array<Promise<OperationRawOutput | OperationModelOutput>>]
    output: Promise<Array<OperationRawOutput | OperationModelOutput>>
  }
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#connect-1
   */
  $connect: {
    input: []
    output: Promise<void>
  }
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#disconnect-1
   */
  $disconnect: {
    input: []
    output: Promise<void>
  }
  /**
   * @see https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#on
   */
  $on: {
    input: [event: EngineEventType, callback: (event: unknown) => void]
    output: void
  }
}

type OtherApi = {
  [method in keyof OperationOtherInfo]: (
    ...args: OperationOtherInfo[method]['input']
  ) => Promise<OperationOtherInfo[method]['output']>
}

/**
 * Groupings
 * -------------------------------------------------------------------------------------------
 */

export type OperationTransactionOutput = OperationOtherInfo['$transaction']['output']

export type OperationOutput = OperationRawOutput | OperationModelOutput | OperationTransactionOutput

/**
 * Overall API
 * -------------------------------------------------------------------------------------------
 */

export interface ClientStaticBase extends RawApi, OtherApi {}

export interface ClientDynamicBase {
  [modelName: string]: ModelApi
}

export type ClientBase = ClientDynamicBase & ClientStaticBase
