import { ProviderTypeInput } from '~/Schema'

/**
 * @returns A valid dummy connection string for the given datasource provider.
 */
export function generate(datasourceProvider: ProviderTypeInput) {
  switch (datasourceProvider) {
    case 'postgresql':
      return 'postgresql://prisma:prisma@localhost:5444/doesntexist'
    case 'mysql':
      return 'mysql://prisma:prisma@localhost:5444/doesntexist'
    case 'sqlserver':
      return 'sqlserver://localhost:5444;database=doesntexist;user=prisma;password=prisma;encrypt=true'
    case 'sqlite':
      return 'file:./dev.db'
    case 'mongodb':
      return 'mongodb://prisma:prisma@localhost/doesntexist'
    // TODO add prismaDataProxy case
    default:
      return ''
  }
}
