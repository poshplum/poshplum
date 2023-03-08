import { Readable } from 'node:stream';

process.stdout.setMaxListeners(1000);

export function write(arg) {
  if (!Array.isArray(arg)) throw new Error(`@{write from}[server-]platform/stdout: array required`);

  const readable = new Readable();
  readable._read = () => {
    for (const item of arg) {
      readable.push(item);
    }
    readable.push("\n");
    readable.push(null);
  };
  readable.pipe(process.stdout);
}
export const hasStdOut = write;

