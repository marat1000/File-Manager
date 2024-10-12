import {FileManagerInterface} from "./file-manager-interface.js";
import {strings} from "./strings.js";

export const cli = new FileManagerInterface({
  input: process.stdin,
  output: process.stdout,
});

export class UsageError extends Error {
  constructor(message = strings.invalidInput) {
    super(message);
    this.name = `UsageError`;
  }
}

const commands = {
  ".exit": () => cli.close(),
  ".help": () => `available commands: ${Object.keys(commands).join(`, `)}`,
};

cli.on(`line`, async (query) => {
  const [cmd, ...args] = query.split(` `);
  try {
    if (commands[cmd] === undefined) {
      throw new UsageError(commands[".help"]());
    }
  } catch (err) {
    if (err instanceof UsageError) {
      console.error(strings.invalidInput);
    } else {
      console.error(strings.error);
    }
    console.error(err.message);
  }
  cli.prompt();
});