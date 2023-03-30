
import { webcrypto } from 'node:crypto';
const {subtle} = webcrypto;

export let PlatformSubtleCrypto = subtle;
