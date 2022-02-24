import { inspect } from 'util'

export const replaceContent = (params: { content: string; pattern: RegExp; replacement: string }) => {
  const { pattern, content, replacement } = params

  if (!pattern.exec(content)) {
    throw new Error(`Pattern ${String(pattern)} does not match on content:\n\n${content}`)
  }

  return content.replace(pattern, replacement)
}

/**
 * TypeScript helper to statically enforce that all cases have been handled in a switch (or similar) block.
 */
export const casesHandled = (x: never): never => {
  // Should never happen, but in case it does :)
  // eslint-disable-next-line
  throw new Error(`All cases were not handled:\n${inspect(x)}`)
}

/**
 * A variant of ReturnType that works on classes to to get their instance type.
 */
// prettier-ignore
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypeClassInstance<T extends new (...args: any) => any> = T extends new (...args: any) => infer R ? R : any
