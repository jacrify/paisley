const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs')

class FileWatcher {
  constructor(dir,processed) {
      this.dir = dir
      this.processed = processed
      this.watcher = null;
  }

    // Function to move a file
  moveFile(sourcePath, destinationDir) {
    const fileName = path.basename(sourcePath);
    const destinationPath = path.join(destinationDir, fileName);

    fs.rename(sourcePath, destinationPath, function(err) {
        if (err) {
          console.error(`Error occurred while moving the file: ${sourcePath} `, err);
          return;
        }
        console.log(`Moved \"${fileName}\" to ${destinationDir}\n\n`);
    });
  }

  startWatching(callfunc) {
    // console.log(callfunc);
    this.watcher = chokidar.watch (this.dir, { 
      awaitWriteFinish: true, 
      ignored: this.processed
    });

    this.watcher.on('all', async (event, path) => {
      //   console.log("Calling ", callfunc, " with ", event, path);
      let re = /\.csv$/i;
      if (event == "add" && re.test(path)) {
        if (await callfunc(path)){
          this.moveFile(path,this.processed)
        }
      }

    });
  }
}

module.exports = FileWatcher;