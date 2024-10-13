import {default as fs, open, readdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {EOL} from "node:os";
import path from "node:path";

import {UsageError} from "./cli.js";

export const commandsObj = {
  up: (arg) => {
    if (arg.length !== 0) throw new UsageError(`up command`);
    process.chdir(`..`);
  },

  cd: (path) => {
    try {
      process.chdir(path);
    } catch (err) {
      throw new UsageError(`cd command`);
    }
  },

  ls: async (arg) => {
    if (arg.length !== 0) throw new UsageError(`ls command`);
    const dirents = await readdir(process.cwd(), {withFileTypes: true});
    const sortedFiles = Object.entries(
      dirents
        .map((dirent) => {
          return {
            name: dirent.name,
            type: dirent.isDirectory() ? `directory` : `file`,
          };
        })
        .sort((a, b) =>
          a.type !== b.type
            ? a.type.localeCompare(b.type)
            : a.name.localeCompare(b.name)
        )
    );
    const lines = sortedFiles.map(([id, ent]) => {
      return [
        id.padStart(sortedFiles.length.toString().length),
        ent.type.padEnd(4),
        ent.name,
      ].join(`  `);
    });
    return lines.join(EOL);
  },

  cat: async (path) => {
    try {
      const fileStream = (await open(path)).createReadStream();
      return fileStream;
    } catch (err) {
      throw new UsageError(`cat command`);
    }
  },

  add: async (name) => {
    try {
      const filePath = resolve(name);
      await writeFile(filePath, ``, {flag: `w+`});
    } catch (err) {
      throw new UsageError(`add command`);
    }
  },

  rename: async (paths) => {
    const [oldPath, newPath] = paths.split(` `);
    try {
      const newPathExists = await fs.access(newPath)
        .then(() => true)
        .catch(() => false);
      if (newPathExists) {
        throw new Error();
      }
      await fs.rename(oldPath, newPath);
    } catch (error) {
      throw new Error(`FS operation failed`);
    }
  }
};
