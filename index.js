#!/usr/bin/env node

const { execSync } = require("child_process");
const { dir } = require("console");
const fs = require("fs");
const path = require("path");

const getExifDate = (path, property) =>
  execSync(`exiftool -${property} -d "%Y-%m-%d" "${path}"`)
    .toString()
    .split(":")[1]
    ?.trim();

const acceptedFileExtensions = [
  ".mp4",
  ".mov",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".heic",
  ".png",
];

const inputDirectoryArg = process.argv[2];
if (!inputDirectoryArg) {
  console.error("No input directory specified");
  process.exit(1);
}
const outputDirectoryArg = process.argv[3];
if (!outputDirectoryArg) {
  console.error("No output directory specified");
  process.exit(1);
}

const inputDirectory = path.resolve(inputDirectoryArg);
const outputDirectory = path.resolve(outputDirectoryArg);
console.log(`Looking for media files in`, inputDirectory);
console.log(`Relocating them to`, outputDirectory);

const readdirSyncRecursive = (dirPath, originalPath, arrayOfFiles = []) => {
  let result = [...arrayOfFiles];

  files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    const newPath = path.join(dirPath, file);
    if (fs.statSync(newPath).isDirectory()) {
      result = readdirSyncRecursive(newPath, originalPath || dirPath, result);
    } else {
      result.push(newPath.split(originalPath || dirPath).pop());
    }
  });

  return result;
};

const imagesToFix = readdirSyncRecursive(inputDirectory).filter((i) =>
  acceptedFileExtensions.some((a) => i.toLowerCase().endsWith(a))
);
console.log(`images`, imagesToFix);
console.log(`${imagesToFix.length} files found`);

for (let image of imagesToFix) {
  const fullFilePath = path.join(inputDirectory, image);
  const fileCreateDate = getExifDate(fullFilePath, "FileCreateDate");
  const fileModifyDate = getExifDate(fullFilePath, "FileModifyDate");
  const actualCreateDate = getExifDate(fullFilePath, "CreateDate");

  let canFix = true;

  if (!actualCreateDate) {
    console.log(`${image}: no real creation date`);
    canFix = false;
  }

  if (
    `${fileCreateDate} ${fileModifyDate}` ===
    `${actualCreateDate} ${actualCreateDate}`
  ) {
    console.log(`${image}: dates match`);
    canFix = false;
  }

  if (canFix) {
    console.log(`${image}: fixing data`);
    execSync(
      `exiftool "-FileCreateDate<CreateDate" "-FileModifyDate<CreateDate" "${fullFilePath}"`
    );
  }

  let moveDirectory = path.join(outputDirectory, "unknown-date");
  if (actualCreateDate) {
    const [year, month] = actualCreateDate.split("-");
    moveDirectory = path.join(outputDirectory, year, month);
  }
  const moveFileLocation = path.join(moveDirectory, image.split("/").pop());
  const destinationExists = fs.existsSync(moveFileLocation);
  if (destinationExists) {
    console.error(`${image}: destination file exists`);
  }

  if (fullFilePath !== moveFileLocation && !destinationExists) {
    execSync(`mkdir -p "${moveDirectory}"`);
    execSync(`mv "${fullFilePath}" "${moveFileLocation}"`);
  }
}
