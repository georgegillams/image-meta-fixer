#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { setDataForFile, filterFilesByAcceptedTypes } = require("./utils");

const inputFileArg = process.argv[2];
if (!inputFileArg) {
  console.error("No input file specified");
  process.exit(1);
}
const dateArg = process.argv[3];
if (!dateArg || !dateArg.match(/^\d{4}:\d{2}:\d{2}\ \d{2}:\d{2}:\d{2}$/)) {
  console.error("No date specified");
  process.exit(1);
}
const outputDirectoryArg = process.argv[4];
if (!outputDirectoryArg) {
  console.error("No output directory specified");
  process.exit(1);
}

const inputFile = path.resolve(inputFileArg);
const outputDirectory = path.resolve(outputDirectoryArg);

const inputIsDirectory = fs.statSync(inputFile).isDirectory();
if (inputIsDirectory) {
  const files = filterFilesByAcceptedTypes(fs.readdirSync(inputFile));
  for (let file of files) {
    const fullFilePath = path.join(inputFile, file);
    setDataForFile(fullFilePath, dateArg, outputDirectory);
  }
} else {
  setDataForFile(inputFile, dateArg, outputDirectory);
}
