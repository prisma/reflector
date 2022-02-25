import { replaceContent } from '~/lib/helpers'

/**
 * @see https://www.prisma.io/docs/concepts/components/preview-features/client-preview-features
 */
export const PreviewFeatureFlag = {
  /**
   * @see https://www.prisma.io/docs/concepts/database-connectors/mongodb
   */
  mongoDb: 'mongoDb',
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-data-platform#step-3-enable-the-feature-flag-in-the-prisma-schema-file
   */
  dataProxy: 'dataProxy',
  /**
   * @see https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-integrity
   */
  referentialIntegrity: 'referentialIntegrity',
} as const

/**
 * @see https://www.prisma.io/docs/concepts/components/preview-features/client-preview-features
 */
export const previewFeaturesPattern = /previewFeatures *= *\[([^\]]+)\]/

export type PreviewFeatureFlag = keyof typeof PreviewFeatureFlag

export const addPreviewFeatureFlag = (params: {
  prismaSchemaContent: string
  previewFlag: PreviewFeatureFlag
}) => {
  const existingPreviewFeatures = params.prismaSchemaContent.match(previewFeaturesPattern)
  if (existingPreviewFeatures) {
    // If the preview flag is already present then return the schema content as is.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- match guarantees this is not null
    if (existingPreviewFeatures[1]!.includes(PreviewFeatureFlag[params.previewFlag])) {
      return params.prismaSchemaContent
    }
    // Add the preview flag to the existing preview features field.
    return replaceContent({
      content: params.prismaSchemaContent,
      pattern: /previewFeatures(.*)=(.*)\[(.+)]/,
      replacement: `previewFeatures$1=$2[$3, "${params.previewFlag}"]`,
    })
  } else {
    // Add the preview flag to a newly added preview features field.
    return replaceContent({
      content: params.prismaSchemaContent,
      pattern: /(provider *= *"prisma-client-js")/,
      replacement: `$1\n  previewFeatures = ["${params.previewFlag}"]`,
    })
  }
}
