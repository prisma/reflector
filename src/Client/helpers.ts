import { ReturnTypeClassInstance } from '../lib/helpers'
// @ts-expect-error This is a private API of the Prisma Client package.
import * as PrismaClientGenerator from '@prisma/client/generator-build'
import { getPrismaClient } from '@prisma/client/runtime'
import { DMMF } from '@prisma/client/runtime/proxy'

export { DMMF }

/**
 * Prisma Client's methods are not === the actual model name. For example, when the model has a name that starts with an uppercase alphabet, it is lowercased
 * So we calculate this "transformed" model name to be able to access the correct key in the `prisma` object.
 */
export const modelNameToClientPropertyName = (modelName: string): string => {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}

/**
 * Transform the DMMF into the Prisma Client TypeScript declaration module.
 */
export const dmmfToTypes = (prismaClientDmmf: DMMF.Document): Promise<string> =>
  // eslint-disable-next-line
  PrismaClientGenerator.dmmfToTypes(prismaClientDmmf)

/**
 * While the Client Base from core is not fully typed there are many good bits we can already extract and benefit from.
 * The following exports do just that.
 */
type ClientBase = ReturnTypeClassInstance<ReturnType<typeof getPrismaClient>>

export type EngineEventType = Parameters<ClientBase['$on']>[0]
