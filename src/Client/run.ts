import { casesHandled } from '../lib/helpers'
import {
  OperationModelName,
  OperationModelOutput,
  OperationOutput,
  OperationRawName,
  OperationRawOutput,
} from '.'
import { ClientBase } from './api'
import { modelNameToClientPropertyName, prepareMigrationScriptForClientExecution } from './helpers'
import { DatasourceProviderNormalized } from '~/Schema'

export type RequestInput = RequestTransactionInput | RequestModelInput | RequestRawInput

export interface RequestTransactionInput {
  _tag: 'RequestTransactionInput'
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

/**
 * Execute a series of SQL statements in a transaction. Beware, uses `$executeRawUnsafe` internally.
 */
export const runSqlStatements = async <Client extends ClientBase>(
  prismaClient: Client,
  sqlStatements: string[]
) =>
  prismaClient.$transaction(sqlStatements.map((sqlStatement) => prismaClient.$executeRawUnsafe(sqlStatement)))

/**
 * Execute a migration script as produced by migrate diff via the prisma client.
 *
 * @remarks One reason you might want to do this is if you want to run your migration via the PDP Data Plane.
 * Currently it has a Client Proxy and Introspection Proxy but no Migration Proxy.
 *
 * A reason you might want to use the PDP Data Plane is if the user has allow-listed the static egress IPs of
 * PDP Data Plane proxy services.
 */
export const runMigrationScript = async <Client extends ClientBase>(
  prismaClient: Client,
  script: string,
  dataSource: DatasourceProviderNormalized
) => runSqlStatements(prismaClient, prepareMigrationScriptForClientExecution({ script, dataSource }))
