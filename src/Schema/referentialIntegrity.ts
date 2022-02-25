import { SchemaTransformer } from './helpers'
import { addPreviewFeatureFlag, PreviewFeatureFlag } from './previewFeatures'
import { replaceContent } from '~/lib/helpers'

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const ReferentialIntegritySettingValue = {
  prisma: 'prisma',
  foreignKeys: 'foreignKeys',
} as const

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export type ReferentialIntegritySettingValue = keyof typeof ReferentialIntegritySettingValue

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const referentialIntegritySettingValueDefault = ReferentialIntegritySettingValue.foreignKeys

/**
 * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
 */
export const setReferentialIntegrity: SchemaTransformer<{ value: ReferentialIntegritySettingValue }> = (
  params
): string => {
  if (params.value === referentialIntegritySettingValueDefault) {
    // TODO removePreviewFlag({...})
    return params.prismaSchemaContent
  }

  const content1 = addPreviewFeatureFlag({
    prismaSchemaContent: params.prismaSchemaContent,
    previewFlag: PreviewFeatureFlag.referentialIntegrity,
  })

  const content2 = replaceContent({
    content: content1,
    pattern: /(url *= *env\(".+"\))/,
    replacement: `$1\n  referentialIntegrity = "${params.value}"`,
  })

  return content2
}
