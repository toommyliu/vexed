#!/usr/bin/env node

// https://github.com/electron/electron/tree/v6.1.12

var version = require('./package').version;

var fs = require('fs');
var os = require('os');
var path = require('path');
var extract = require('extract-zip');
var download = require('electron-download');

var installedVersion = null;
try {
  installedVersion = fs
    .readFileSync(path.join(__dirname, 'dist', 'version'), 'utf-8')
    .replace(/^v/, '');
} catch (ignored) {
  // do nothing
}

if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD) {
  process.exit(0);
}

var platformPath = getPlatformPath();

var electronPath =
  process.env.ELECTRON_OVERRIDE_DIST_PATH ||
  path.join(__dirname, 'dist', platformPath);

if (installedVersion === version && fs.existsSync(electronPath)) {
  process.exit(0);
}

const OUR_ELECTRON_VERSION = '6.1.12';
const OUR_ELECTRON_ARCH = 'x64';

// downloads if not cached
download(
  {
    cache: process.env.electron_config_cache,
    version: OUR_ELECTRON_VERSION,
    platform: process.env.npm_config_platform,
    arch: OUR_ELECTRON_ARCH,
    strictSSL: process.env.npm_config_strict_ssl === 'true',
    force: process.env.force_no_cache === 'true',
    quiet: process.env.npm_config_loglevel === 'silent' || process.env.CI,
  },
  extractFile
);

// unzips and makes path.txt point at the correct executable
function extractFile(err, zipPath) {
  if (err) return onerror(err);
  extract(zipPath, { dir: path.join(__dirname, 'dist') }, function (err) {
    if (err) return onerror(err);
    fs.writeFile(
      path.join(__dirname, 'path.txt'),
      platformPath,
      function (err) {
        if (err) return onerror(err);
      }
    );
  });
}

function onerror(err) {
  throw err;
}

function getPlatformPath() {
  var platform = process.env.npm_config_platform || os.platform();

  switch (platform) {
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron';
    case 'freebsd':
    case 'linux':
      return 'electron';
    case 'win32':
      return 'electron.exe';
    default:
      throw new Error(
        'Electron builds are not available on platform: ' + platform
      );
  }
}
