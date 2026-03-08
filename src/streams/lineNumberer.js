import { Transform } from 'stream';

const lineNumberer = () => {
  let line = 1;

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const result = lines
        .map((text) => (text ? `${line++} | ${text}` : text))
        .join('\n');

      callback(null, result);
    },
  });

  process.stdin
    .pipe(transform)

    .pipe(process.stdout);
};

lineNumberer();
