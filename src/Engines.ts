import { casesHandled } from './helpers'
import { getNodeAPIName, getPlatform } from '@prisma/sdk'

export type Kind = 'query'

/**
 * `binary` is legacy system where a child process is spawned.
 * `library` uses the new Node API system.
 */
export type EmbedStrategy = 'binary' | 'library'

/**
 * Get the file name of a Prisma engine binary
 */
export const getFileName = async (engineKind: Kind, embedStrategy: EmbedStrategy): Promise<string> => {
  const platform = await getPlatform()
  const extension = platform === 'windows' ? '.exe' : ''

  if (embedStrategy === 'library') {
    return getNodeAPIName(platform, 'fs')
  } else if (embedStrategy === 'binary') {
    return `${engineKind}-engine-${platform}${extension}`
  } else {
    // TODO TS is complaining that casesHandled will somehow not terminate here even though it has never return type???
    throw casesHandled(embedStrategy)
  }
}
