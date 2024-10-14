import {default as fs, open, readdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {EOL, arch, cpus, userInfo} from "node:os";
import path from "node:path";
import fss from 'node:fs';
import { createBrotliCompress, createBrotliDecompress } from "node:zlib";

import {UsageError} from "./cli.js";
import {pipeline} from "node:stream/promises";
import crypto from "node:crypto";

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

  rn: async (paths) => {
    const pathsArr = paths.split(` `);
    if (pathsArr.length !== 2) {
      throw new UsageError(`rn command`);
    }
    const [oldPath, newPath] = pathsArr
    try {
      const newPathExists = await fs.access(newPath)
        .then(() => true)
        .catch(() => false);
      if (newPathExists) {
        throw new Error();
      }
      await fs.rename(oldPath, newPath);
    } catch (error) {
      throw new UsageError(`rn command`);
    }
  },

  cp: async (paths) => {
    const pathsArr = paths.split(` `);
    if (pathsArr.length !== 2) {
      throw new UsageError(`cp command`);
    }
    const [oldPath, newPath] = pathsArr;
    const oldPathAbs = resolve(oldPath);
    const fileName = path.basename(oldPathAbs);
    const newPathAbs = resolve(newPath, fileName);
    const srcStream = (await open(oldPathAbs, `r`)).createReadStream();
    const dstStream = (await open(newPathAbs, `wx`)).createWriteStream();
    await pipeline(srcStream, dstStream);
  },

  mv: async function (paths) {
    console.dir(this);
    await this.cp(paths);
    const pathsArr = paths.split(` `);
    await this.rm(pathsArr[0]);
  },

  rm: async (path) => {
    const pathArr = path.split(` `);
    if (pathArr.length !== 1) {
      throw new UsageError(`cp command`);
    }
    const pathAbs = resolve(path);
    await fs.unlink(pathAbs);
  },

  os: (arg) => {
    switch (arg) {
      case `--EOL`:
        return JSON.stringify(EOL);
      case `--cpus`:
        const cpusArr = cpus();
        const cpusDesc = Object.entries(cpusArr)
          .map(([id, cpu]) => `${id}: ${cpu.model}, ${cpu.speed / 1000} GHz`)
          .join(EOL) + EOL;
        return `${cpusArr.length} CPUs:${EOL}${cpusDesc}`;
      case `--homedir`:
        return userInfo().homedir;
      case `--username`:
        return userInfo().username;
      case `--architecture`:
        return arch();
      default:
        throw new UsageError(
          `os command`
        );
    }
  },

  hash: async (path) => {
    const pathToFile = resolve(path);
    try {
      const hashValue = await getHash(pathToFile);
      console.log(hashValue);
    } catch (error) {
      throw new UsageError(`hash command`);
    }
    function getHash(path) {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash(`sha256`);
        const rs = fss.createReadStream(path);
        rs.on(`error`, reject);
        rs.on(`data`, chunk => {
          hash.update(chunk);
        });
        rs.on(`end`, () => resolve(hash.digest(`hex`)));
      })
    }
  },

  compress: async function (paths) {
    await this._handle(createBrotliCompress(), paths);
  },

  decompress: async function (paths) {
    await this._handle(createBrotliDecompress(), paths);
  },

  _handle: async (transform, paths) => {
    const pathsArr = paths.split(` `);
    if (pathsArr.length !== 2) {
      throw new UsageError(`cp command`);
    }
    const [oldPath, newPath] = pathsArr;
    const oldPathAbs = resolve(oldPath);
    const fileName = path.basename(oldPathAbs);
    console.dir(fileName);
    const newPathAbs = resolve(newPath, fileName);
    const srcPath = resolve(oldPathAbs);
    const dstPath = resolve(newPathAbs);
    const srcStream = (await open(srcPath, `r`)).createReadStream();
    const dstStream = (await open(dstPath, `wx`)).createWriteStream();
    await pipeline(srcStream, transform, dstStream);
  }

};
