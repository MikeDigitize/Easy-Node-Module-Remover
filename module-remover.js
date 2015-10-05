/*
 *  Easy Node Module Remover - removes all contents of Node_Modules directory
 *
 *  Usage: Put in root directory alongside package.json file
 *  Terminal: node module-remover 
 *  Will remove all dependencies but can be overridden by specifying dependency type key(s) on command line
 *
 *  e.g. node module-remover dependencies optionalDependencies
 *  will just remove dependencies from those particular object trees in your package.json
 *
 */

var fs = require("fs");
var keys = ["devDependencies", "optionalDependencies", "dependencies", "bundledDependencies"];
var args = process.argv.splice(2, process.argv.length);
if(args.length) {
  keys = args;
}

fs.readFile("./package.json", "utf8", function (err, data) {
  if(err) {
    console.log(err);
  }
  else {
    var json = JSON.parse(data);
    keys.forEach(function(key) {
      if(json[key]) {
        new EasyNodeModuleRemover(json[key]).init();
      } 
      else {
        console.log(key, "not found in package.json file");
      }     
    });
  }
});

/*
 *  Constructor
 */

function EasyNodeModuleRemover(data) {
  this.data = data;
}

/*
 *  Grab any project dependencies listed in the package json data
 *  Creates a relative path from root for each dependency and searches for all files / directories within
 */

EasyNodeModuleRemover.prototype.init = function() {

  this.dependencies = Object.keys(this.data);
  if(this.dependencies.length) {
    this.numOfModulesToRemove = this.dependencies.length;
    this.dependencies.map(function(dependency) {
      return "node_modules/" + dependency;
    }).forEach(function(dependencyPath) {
      console.log("Starting removal of", dependencyPath, "directory"); 
      var remove = new this.DependencyRemover(dependencyPath);
      remove.then(function() {
        this.removeModuleFolder();
      }.bind(this)).catch(function(e) {
        console.log("Error within " + dependencyPath, e.msg);
      });
    }.bind(this));
  }   

};

/*
 * When all directories and files have been removed, remove the top level node_modules directories
 */

EasyNodeModuleRemover.prototype.removeModuleFolder = function() {

  this.numOfModulesToRemove--;
  console.log("Finished removing dependency, ", this.numOfModulesToRemove, "remaining in this queue");
  if(!this.numOfModulesToRemove) {
    this.dependencies.forEach(function(dep) {
      fs.rmdirSync("node_modules/" + dep);
    });
  }

};

/*
 * Returns a promise that resolves when all files / directories within the folder have been removed
 */

EasyNodeModuleRemover.prototype.DependencyRemover = function(path) {

  return new Promise(function(res, rej) {
    this.resolve = res;
    this.reject = rej;
    this.directories = [];
    this.files = [];
    this.directoriesBeingSearched = [];
    this.getDirectoryContents(path);
  }.bind(this));  

};

 /*
  *  Loops through contents of a directory sorting files from directories
  *  Once all directories have been searched begin removing files
  */

EasyNodeModuleRemover.prototype.DependencyRemover.prototype.getDirectoryContents = function(directoryPath) {
  
  var count, content;
  this.directoriesBeingSearched.push(directoryPath);  
  
  fs.readdir(directoryPath, function(e, filepaths) {

    if(e) {
      this.reject({ msg : "Are you sure that " + directoryPath + " exists?", error : e });
    }
    else {
      count = filepaths.length;
      filepaths.forEach(function(file) { 

        content = this.getFileType(directoryPath, file);
        content.then(function(isDirectory) {

          count--;
          if(isDirectory) {
            this.directories.push(directoryPath + "/" + file);
          }
          else {
            this.files.push(directoryPath + "/" + file);
          }
          if(!count){
            this.directoriesBeingSearched.splice(this.directoriesBeingSearched.indexOf(directoryPath), 1);
            if(this.haveAllDirectoriesBeenChecked()) {
              this.removeFiles();
            }
          }

        }.bind(this)).catch(function(e) {
          this.reject({ msg : "Cannot read file " + file, error : e });
        }.bind(this));

      }.bind(this));      
    }   

  }.bind(this)); 

};

 /*
  *  Test if the file is a directory or not
  *  If it's a directory start a new search by passing the directory path back into the getDirectoryContents function
  */

EasyNodeModuleRemover.prototype.DependencyRemover.prototype.getFileType = function(path, file) {

  return new Promise(function(res, rej) {

    var filepath = path + "/" + file, isDirectory = false;
    fs.stat(filepath, function(err, stats) {

      if (err) {
        rej(err);
      }
      else {
        if(stats.isDirectory()) {
          isDirectory = true;
          this.getDirectoryContents(filepath);
        }
        res(isDirectory);
      } 

    }.bind(this));

  }.bind(this));

};


EasyNodeModuleRemover.prototype.DependencyRemover.prototype.haveAllDirectoriesBeenChecked = function() {
  if(!this.directoriesBeingSearched.length) {
    return true;
  } 
  else {
    return false;
  }
};

EasyNodeModuleRemover.prototype.DependencyRemover.prototype.removeFiles = function() {

  console.log("Sub directory search complete, starting removal of files");
  this.files.forEach(function(file) {
    fs.unlinkSync(file);
  });

  if(!this.directories.length) {
    this.resolve();
  }
  else {
    console.log("Removal of files complete, starting directory removal");
    this.removeDirectories(0);
  }

};

EasyNodeModuleRemover.prototype.DependencyRemover.prototype.removeDirectories = function(index) {

  var checkIsEmpty = this.checkIfEmptyDirectory(this.directories[index]);
  checkIsEmpty.then(function(result) {

    if(result) {
      fs.rmdirSync(this.directories[index]);
      this.directories.splice(index, 1);
      if(this.directories.length) {
        this.removeDirectories(0);
      }
      else {
        this.resolve();
      }
    }
    else {
      index++;
      if(index === this.directories.length) {
        this.removeDirectories(0);
      }
      else {
        this.removeDirectories(index);
      }  
    }

  }.bind(this)).catch(function(e) {
    this.reject({ msg : "Cant check if the file " + this.directories[index] + " is empty", error : e });
  }.bind(this));

};

EasyNodeModuleRemover.prototype.DependencyRemover.prototype.checkIfEmptyDirectory = function(directoryPath) {

  return new Promise(function(res, rej) {
    fs.readdir(directoryPath, function(err, filepaths) {
      if (err) {
        console.log(err);
        rej(err);
      }
      else {
        if(!filepaths.length) {
          res(true);
        }
        else {
          res(false);
        }
      }
    });
  });

};