import { PrismaUtils } from '~/index'

describe('parseDatasourceOrThrow', () => {
  describe('success', () => {
    describe('provider type input is accepted, but normalized upon return', () => {
      it('postgresql becomes postgres', () => {
        const result1 = PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {
            provider = "postgres"
            url = env("...")
          }
        `)
        const result2 = PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {
            provider = "postgresql"
            url = env("...")
          }
        `)
        expect(result1.provider).toEqual(PrismaUtils.Schema.ProviderTypeNormalized._def.values.postgres)
        expect(result1.provider).toEqual(result2.provider)
      })
    })
    describe('ignores comments', () => {
      test('a whole datasource block', () => {
        expect(
          PrismaUtils.Schema.parseDatasourceOrThrow(`
            //datasource db_old {
            //  url = env("...old")
            //}
            // datasource db_old_2 {
            datasource db {
              url = env("...")
              provider = "postgres"
            }
          `)
        ).toMatchSnapshot()
      })
      test('single field lines', () => {
        expect(
          PrismaUtils.Schema.parseDatasourceOrThrow(`
            datasource db {
              // url = env("bad1")
              url = env("...")
              ///  url = "bad2"
            //blah url = "bad3"
                ///blah url = "bad4"
              provider = "postgres"
            }
          `)
        ).toMatchSnapshot()
      })
    })

    test('finds inline connection string', () => {
      expect(
        PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {
            url = "..."
              provider = "postgres"
          }
        `)
      ).toMatchSnapshot()
    })
    describe('environment variable reference', () => {
      test('finds when nicely formatted', () => {
        expect(
          PrismaUtils.Schema.parseDatasourceOrThrow(`
            datasource db {
              url = env("FOOBAR")
              provider = "postgres"
            }
          `)
        ).toMatchSnapshot()
      })

      test('finds when white space before or after quotes', () => {
        expect(
          PrismaUtils.Schema.parseDatasourceOrThrow(`
            datasource db {
              url = env(  "FOOBAR"  )
              provider = "postgres"
            }
          `)
        ).toMatchSnapshot()
      })
    })
  })
  describe('thrown errors', () => {
    test('multiple data source blocks causes an error', () => {
      expect(() =>
        PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db1 {
            url = "..."
          }

          datasource db2 {
            url = "..."
          }
        `)
      ).toThrowErrorMatchingSnapshot()
    })

    test('Datasource block missing url field causes an error', () => {
      expect(() =>
        PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {}
        `)
      ).toThrowErrorMatchingSnapshot()
    })
    test('Missing a provider field causes an error', () => {
      expect(() =>
        PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {
            url = "..."
          }
        `)
      ).toThrowErrorMatchingSnapshot()
    })
    test('An invalid provider field causes an error', () => {
      expect(() =>
        PrismaUtils.Schema.parseDatasourceOrThrow(`
          datasource db {
            url = "..."
            provider = "sqlitee"
          }
        `)
      ).toThrowErrorMatchingSnapshot()
    })
  })
})
