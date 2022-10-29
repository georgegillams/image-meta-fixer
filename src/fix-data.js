#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const {
  acceptedFileExtensions,
  getExifDate,
  readdirSyncRecursive,
  filterFilesByAcceptedTypes,
  getFileNameDate,
} = require("./utils");

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
const shouldFix = process.argv.includes("--fix");
const shouldMove = process.argv.includes("--move");

const inputDirectory = path.resolve(inputDirectoryArg);
const outputDirectory = path.resolve(outputDirectoryArg);
console.log(`Looking for media files in`, inputDirectory);
console.log(`Relocating them to`, outputDirectory);

const imagesToFix = filterFilesByAcceptedTypes(
  readdirSyncRecursive(inputDirectory)
);
console.log(`images`, imagesToFix);
console.log(`${imagesToFix.length} files found`);
if (shouldFix) {
  console.log(`Will now fix dates in those files`);
}
if (shouldMove) {
  console.log(`Will now move those files according to their dates`);
}

for (let image of imagesToFix) {
  const fullFilePath = path.join(inputDirectory, image);
  let actualCreateDate = null;

  if (shouldFix) {
    try {
      const fileCreateDate = getExifDate(fullFilePath, "FileCreateDate");
      const fileModifyDate = getExifDate(fullFilePath, "FileModifyDate");
      actualCreateDate =
        getExifDate(fullFilePath, "CreateDate") ||
        getFileNameDate(fullFilePath);

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
        console.log(`${image}: fixing date to ${actualCreateDate}`);
        execSync(
          `exiftool "-FileCreateDate<CreateDate" "-FileModifyDate<CreateDate" "${fullFilePath}"`
        );
      }
    } catch (e) {
      console.log(`${image}: error editing metadata`, e);
    }
  }

  if (shouldMove) {
    try {
      let moveDirectory = path.join(outputDirectory, "unknown-date");
      if (actualCreateDate) {
        const [year, month] = actualCreateDate.split("-");
        moveDirectory = path.join(outputDirectory, year, month);
      }
      let moveFileLocation = path.join(moveDirectory, image.split("/").pop());
      if (fullFilePath !== moveFileLocation) {
        // Ensure destination file has unique name so
        // we don't overwrite anything
        while (fs.existsSync(moveFileLocation)) {
          const ext = path.extname(moveFileLocation);
          const base = path.basename(moveFileLocation, ext);
          moveFileLocation = path.join(moveDirectory, `${base}-1${ext}`);
        }

        execSync(`mkdir -p "${moveDirectory}"`);
        execSync(`mv "${fullFilePath}" "${moveFileLocation}"`);
      }
    } catch (e) {
      console.log(`${image}: error moving image`, e);
    }
  }
}
