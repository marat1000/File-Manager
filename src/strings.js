import {EOL} from "node:os";

import {args} from "./args.js";

export const strings = {
  hello: args.username
    ? `Welcome to the File Manager, ${args.username}!`
    : `Welcome to the File Manager!`,
  goodbye: args.username
    ? `${EOL}Thank you for using File Manager, ${args.username}, goodbye!`
    : `${EOL}Thank you for using File Manager, goodbye!`,
  invalidInput: `Invalid input`,
  error: `Operation failed`,
  prompt: `Type your command, please.${EOL}> `,
  get workdir() {
    return `You are currently in ${process.cwd()}`;
  },
};