import { casesHandled } from '../lib/helpers'
import {
  OperationModelName,
  OperationModelOutput,
  OperationOutput,
  OperationRawName,
  OperationRawOutput,
} from '.'
import { ClientBase } from './api'
import { modelNameToClientPropertyName } from './helpers'

export type RequestInput = RequestTransactionInput | RequestModelInput | RequestRawInput

export interface RequestTransactionInput {
  _tag: 'RequestTransactionInput'
  // TODO can we mix model and raw here?
  singulars: (RequestModelInput | RequestRawInput)[]
}
export interface RequestRawInput {
  _tag: 'RequestRawInput'
  operationName: OperationRawName
  operationInput: unknown
}
export interface RequestModelInput {
  _tag: 'RequestModelInput'
  modelName: string
  operationName: OperationModelName
  operationInput: unknown
}

export const runRequest = <Client extends ClientBase>(
  prismaClient: Client,
  requestInput: RequestInput
): Promise<OperationOutput> => {
  return requestInput._tag === 'RequestTransactionInput'
    ? prismaClient.$transaction(
        requestInput.singulars.map((_) =>
          _._tag === 'RequestRawInput' ? runRequestRaw(prismaClient, _) : runRequestModel(prismaClient, _)
        )
      )
    : requestInput._tag === 'RequestModelInput'
    ? runRequestModel(prismaClient, requestInput)
    : requestInput._tag === 'RequestRawInput'
    ? runRequestRaw(prismaClient, requestInput)
    : casesHandled(requestInput)
}

const runRequestRaw = <Client extends ClientBase>(
  prismaClient: Client,
  requestSingularInput: RequestRawInput
): Promise<OperationRawOutput> => {
  return prismaClient[requestSingularInput.operationName](requestSingularInput.operationInput)
}

const runRequestModel = <Client extends ClientBase>(
  prismaClient: Client,
  requestSingularInput: RequestModelInput
): Promise<OperationModelOutput> => {
  const prismaOrmModelPropertyName = modelNameToClientPropertyName(requestSingularInput.modelName)

  const prismaClientModel = prismaClient[prismaOrmModelPropertyName]

  if (!prismaClientModel) {
    throw new Error(
      `The Prisma client instance has no property of name  \`${prismaOrmModelPropertyName}\`. This means that the Prisma client instance was generated from a prisma schema that does not have the model named \`${requestSingularInput.modelName}\`.`
    )
  }

  const prismaClientModelOperation = prismaClientModel[requestSingularInput.operationName]

  return prismaClientModelOperation(requestSingularInput.operationInput)
}
