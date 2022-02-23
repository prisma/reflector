/**
 * Prisma Client's methods are not === the actual model name. For example, when the model has a name that starts with an uppercase alphabet, it is lowercased
 * So we calculate this "transformed" model name to be able to access the correct key in the `prisma` object.
 */
export const modelNameToClientPropertyName = (modelName: string): string => {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1)
}
