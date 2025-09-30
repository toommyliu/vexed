var fs = require('fs');
var path = require('path');

var pathFile = path.join(__dirname, 'path.txt');
console.log('expected pathFile at', pathFile);
function getElectronPath() {
  if (fs.existsSync(pathFile)) {
    console.log('found pathFile');
    var executablePath = fs.readFileSync(pathFile, 'utf-8');
    if (process.env.ELECTRON_OVERRIDE_DIST_PATH) {
      return path.join(process.env.ELECTRON_OVERRIDE_DIST_PATH, executablePath);
    }
    return path.join(__dirname, 'dist', executablePath);
  } else {
    console.log('missing pathFile');
    throw new Error(
      'Electron failed to install correctly, please delete node_modules/electron and try installing again'
    );
  }
}

module.exports = getElectronPath();
