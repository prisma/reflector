import { Schema } from '../index_'

/**
 * @returns A valid dummy connection string for the given datasource provider.
 */
export const generate = (datasourceProvider: Schema.DatasourceProviderNormalized) => {
  switch (datasourceProvider) {
    case 'cockroachdb':
    case 'postgres':
      return 'postgresql://prisma:prisma@localhost:5444/does_not_exist'
    case 'mysql':
      return 'mysql://prisma:prisma@localhost:5444/does_not_exist'
    case 'sqlserver':
      return 'sqlserver://localhost:5444;database=does_not_exist;user=prisma;password=prisma;encrypt=true'
    case 'sqlite':
      return 'file:./dev.db'
    default:
      return ''
  }
}
