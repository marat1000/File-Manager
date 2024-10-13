import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";

import {FileManagerInterface} from "./file-manager-interface.js";
import {strings} from "./strings.js";
import {commandsObj} from "./commands.js";

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

Object.entries(commandsObj).forEach((item) => {
  commands[item[0]] = item[1];
})

cli.on(`line`, async (query) => {
  const [cmd, arg] = parseQuery(query);

  try {
    if (commands[cmd] === undefined) {
      throw new UsageError(commands[".help"]());
    }
    const response = await commands[cmd](arg);
    if (response instanceof Readable) {
      await pipeline(response, process.stdout, {end: false});
    } else if (response) {
      console.log(response);
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

function parseQuery(str) {
  let i = 0;
  while (i !== str.length && str[i] !== ` `) {
    i++;
  }
  console.dir([str.slice(0, i), str.slice(i + 1)])
  return [str.slice(0, i), str.slice(i + 1).trim()];
}
