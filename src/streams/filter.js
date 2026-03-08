import { Transform } from "stream";

const filter = () => {
  const args = process.argv;
  const patterns = filterInput(args);
  const hasPatternFlag = args.includes('--pattern');

  let buffer = "";

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      const result = hasPatternFlag
        ? lines.filter((line) =>
            patterns.some((pattern) => line.includes(pattern))
          )
        : lines;

      const output = result.length > 0 ? result.join("\n") + "\n" : "";
      callback(null, output);
    },
    flush(callback) {
      if (buffer && (!hasPatternFlag || patterns.some((p) => buffer.includes(p)))) {
        callback(null, buffer + "\n");
      } else {
        callback(null);
      }
    },
  });

  process.stdin.pipe(transform).pipe(process.stdout);
};

filter();

function filterInput(inputs) {
  const patterns = [];
  if (!inputs) return patterns;

  const startIndex = inputs.indexOf("--pattern");
  if (startIndex === -1) return patterns;

  for (let i = startIndex + 1; i < inputs.length; i++) {
    const arg = inputs[i];
    if (arg && !arg.startsWith("--")) {
      patterns.push(arg);
    } else {
      break;
    }
  }
  return patterns;
}