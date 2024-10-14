import {Interface} from "node:readline/promises";
import {strings} from "./strings.js";

export class FileManagerInterface extends Interface {
  constructor(...args) {
    super(...args);
    console.log(strings.hello);
    this.setPrompt(strings.prompt);
  }

  prompt(...args) {
    console.log(strings.workdir);
    super.prompt(...args);
  }

  close(...args) {
    super.close(...args);
    console.log(strings.goodbye);
    process.exit(0);
  }
}