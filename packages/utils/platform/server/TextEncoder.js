// NOTE that 'util' is built-in on node's server environment,
// and isn't because TextEncoder is native in the browser, it's not needed there.
// Therefore: Don't install the npm 'util' package on account of this module.
export { TextEncoder as PlatformTextEncoder } from 'node:util';
