import { OperationModelInfo, OperationRawInfo } from './operations'

type ModelApi = {
  [operation in keyof OperationModelInfo]: (
    input: unknown
  ) => Promise<OperationModelInfo[operation]['output']>
}

type RawApi = {
  [operation in keyof OperationRawInfo]: (
    ...args: unknown[]
  ) => Promise<OperationRawInfo[operation]['output']>
}

export interface ClientStaticBase extends RawApi {
  $transaction: (promises: Promise<unknown>[]) => Promise<unknown[]>
  $connect: () => Promise<unknown>
  $disconnect: () => Promise<unknown>
  $on: () => Promise<unknown>
}

export interface ClientDynamicBase {
  [modelName: string]: ModelApi
}

export type ClientBase = ClientDynamicBase & ClientStaticBase
