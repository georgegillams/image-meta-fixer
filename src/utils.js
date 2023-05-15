const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const getExifDate = (path, property) => {
  const exifDate = execSync(`exiftool -${property} -d "%Y-%m-%d" "${path}"`)
    .toString()
    .split(":")[1]
    ?.trim();

  if (exifDate === "0000") {
    return null;
  }

  return exifDate;
};

const getFileNameDate = (path) => {
  const fileName = path.split("/").pop();
  const date = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return date && date[0];
};

const acceptedFileExtensions = [
  ".mp4",
  ".mov",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".heic",
  ".dng",
  ".cr2",
  ".nef",
  ".orf",
  ".arw",
  ".rw2",
  ".raf",
  ".srw",
  ".tif",
  ".tiff",
  ".bmp",
  ".webp",
];

const filterFilesByAcceptedTypes = (files) =>
  files.filter(
    (file) =>
      file && acceptedFileExtensions.some((a) => file.toLowerCase().endsWith(a))
  );

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

const setDataForFile = (inputFile, dateArg, outputDirectory) => {
  execSync(
    `exiftool "-FileCreateDate=${dateArg}" "-FileModifyDate=${dateArg}" "-CreateDate=${dateArg}" "-ModifyDate=${dateArg}" "${inputFile}"`
  );

  const [year, month] = dateArg.split(":");
  const moveDirectory = path.join(outputDirectory, year, month);
  const moveFileLocation = path.join(moveDirectory, inputFile.split("/").pop());
  const destinationExists = fs.existsSync(moveFileLocation);
  if (destinationExists) {
    console.error(`${inputFile}: destination file exists`);
  }

  if (inputFile !== moveFileLocation && !destinationExists) {
    execSync(`mkdir -p "${moveDirectory}"`);
    execSync(`mv "${inputFile}" "${moveFileLocation}"`);
  }
};

module.exports = {
  getExifDate,
  getFileNameDate,
  acceptedFileExtensions,
  filterFilesByAcceptedTypes,
  readdirSyncRecursive,
  setDataForFile,
};
