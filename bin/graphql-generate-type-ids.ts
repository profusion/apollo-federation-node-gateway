#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildClientSchema, buildASTSchema, printSchema, parse } from 'graphql';
import difference from 'lodash.difference';
import yargs from 'yargs';

const args = yargs
  .command('<root> <output>', '', ctx =>
    ctx
      .positional('root', {
        describe: 'A folder to recursively search for GraphQL schemas.',
        type: 'string',
      })
      .positional('output', {
        describe: 'Where to save the typeIds.json file.',
        type: 'string',
      }),
  )
  .demandCommand(2)
  .option('ignoreFolders', {
    alias: 'i',
    array: true,
    default: 'node_modules',
    description:
      'Folders that should be ignored when scanning GraphQL schemas. If multiple folders should be ignore use space to separate them.',
    type: 'string',
  })
  .option('schemaFileName', {
    alias: 's',
    default: 'graphql.schema.json',
    description: 'The name of the GraphQL schema file.',
    type: 'string',
  }).argv;

const foldersToIgnore = new Set(args.ignoreFolders);

const searchSchemas = (dirPath: string): string[] =>
  fs
    .readdirSync(dirPath, { encoding: 'utf-8', withFileTypes: true })
    .reduce((acc: string[], dirEnt: fs.Dirent): string[] => {
      const filePath = path.join(dirPath, dirEnt.name);
      if (dirEnt.name === args.schemaFileName) {
        acc.push(filePath);
        return acc;
      }
      if (dirEnt.isDirectory() && !foldersToIgnore.has(dirEnt.name)) {
        return acc.concat(searchSchemas(filePath));
      }
      return acc;
    }, []);

const nodeTypes = new Set<string>();
const rootFolder = args._[0] as string;
const fileEncoding: { encoding: BufferEncoding } = { encoding: 'utf8' };

searchSchemas(rootFolder).forEach((filePath: string): void => {
  const schema = buildClientSchema(
    JSON.parse(fs.readFileSync(filePath, fileEncoding)),
  );
  const validSchema = buildASTSchema(parse(printSchema(schema)));
  Object.entries(validSchema.getTypeMap()).forEach(([name, { astNode }]) => {
    if (
      !astNode ||
      astNode.kind !== 'ObjectTypeDefinition' ||
      !astNode.interfaces ||
      !astNode.interfaces.length
    ) {
      return;
    }
    const { interfaces } = astNode;
    for (let i = 0; i < interfaces.length; i += 1) {
      const {
        name: { value },
      } = interfaces[i];
      if (value === 'Node') {
        if (!nodeTypes.has(name)) {
          nodeTypes.add(name);
        }
        break;
      }
    }
  });
});

let lastId = 0;
let fileContents: { [key: string]: number } = {};

const typeIdsFilePath = path.join(args._[1] as string, 'typeIds.json');

try {
  fileContents = JSON.parse(fs.readFileSync(typeIdsFilePath, fileEncoding));
  Object.values<number>(fileContents).forEach((id: number): void => {
    lastId = Math.max(id, lastId);
  });
  lastId += 1;
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

const diff = difference<string>(
  Array.from(nodeTypes),
  Object.keys(fileContents),
);

if (diff.length > 0) {
  diff.sort();
  diff.forEach((typeName: string): void => {
    fileContents[typeName] = lastId;
    lastId += 1;
  });

  fs.writeFileSync(
    typeIdsFilePath,
    `${JSON.stringify(fileContents, undefined, 2)}${os.EOL}`,
    {
      ...fileEncoding,
      flag: 'w',
    },
  );
}
