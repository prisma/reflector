export const to = (content: string): string =>
  // eslint-disable-next-line
  isBrowser() ? btoa(content) : Buffer.from(content, 'utf-8').toString('base64')

export const from = (content: string): string =>
  // eslint-disable-next-line
  isBrowser() ? atob(content) : Buffer.from(content, 'base64').toString('utf-8')

const isBrowser = () =>
  // @ts-expect-error `window` is an unknown global
  typeof window !== 'undefined'
