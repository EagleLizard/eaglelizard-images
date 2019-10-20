const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

const sharp = require('sharp');

const INPUT_DIRNAME = 'input';
const OUTPUT_DIRNAME = 'output';
const INPUT_DIR = `${__dirname}/${INPUT_DIRNAME}`;
const OUTPUT_DIR = `${__dirname}/${OUTPUT_DIRNAME}`;
const MAX_HEIGHT = 682;

module.exports = {
  optimizeImages,
};

async function optimizeImages() {
  let filePaths, optimizePromises;
  await init();
  filePaths = await getFilePaths(INPUT_DIR);
  filePaths.sort();
  optimizePromises = filePaths.map(async (filePath, idx) => {
    await optimize(filePath, idx);
  });
  await Promise.all(optimizePromises);
}

async function init() {
  try {
    await mkdir(OUTPUT_DIR);
  } catch(e) {
    if(e.code !== 'EEXIST') {
      console.log(e);
    }
  }
}

async function optimize(imagePath, idx) {
  let image, inputPathParts, outputPathParts, outPath,
    inputDirIdx, inputImageFile, inputImageExt, inputParentDir;
  // get the path without parent dirs starting from input_dir
  inputPathParts = imagePath.split(path.sep);
  inputDirIdx = inputPathParts.findIndex(part => part === INPUT_DIRNAME);
  // rename the file by passed index if there is a parent directory
  outputPathParts = inputPathParts.slice(inputDirIdx + 1);
  if(outputPathParts.length > 1) {
    inputImageFile = outputPathParts.pop();
    inputParentDir = outputPathParts[ outputPathParts.length - 1 ];
    inputImageExt = inputImageFile.split('.').pop();
    outputPathParts.push(`${inputParentDir}${idx + 1}.${inputImageExt}`);
  }
  await createSubDirectories(OUTPUT_DIR, outputPathParts.slice(0, -1));

  outPath = path.resolve(OUTPUT_DIR, ...outputPathParts);
  image = sharp(imagePath);
  await image.resize({ height: MAX_HEIGHT })
    .toFile(outPath);
}

async function createSubDirectories(sourcePath, dirs) {
  let soFar, dirPath;
  soFar = [];
  for(let i = 0, dir; i < dirs.length; ++i) {
    dir = dirs[i];
    dirPath = path.resolve(sourcePath, ...soFar, dir);
    console.log('dirPath');
    console.log(dirPath);
    try {
      await mkdir(dirPath);
    } catch(e) {
      if(e.code !== 'EEXIST') {
        console.log(e);
      }
    }
    soFar.push(dir);
  }
}

async function getFilePaths(sourcePath, filePaths) {
  let files, statPromises;
  if(filePaths === undefined) {
    filePaths = [];
  }
  files = await readdir(sourcePath);
  statPromises = files.map(async file => {
    let isDir, filePath;
    filePath = path.resolve(sourcePath, file);
    isDir = (await stat(filePath)).isDirectory();
    if(isDir) {
      return getFilePaths(filePath, filePaths);
    }
    filePaths.push(filePath);
  });
  await Promise.all(statPromises);
  return filePaths;
}
