'use strict';

var childProcess = require("child_process");
var _ = require('lodash');
var compilerBinaryName = "elm-make";

var defaultOptions     = {
  warn:       console.warn,
  spawn:      childProcess.spawn,
  pathToMake: undefined,
  yes:        undefined,
  help:       undefined,
  output:     undefined,
  verbose:    false
};

var supportedOptions = _.keys(defaultOptions);

function compile(sources, options) {
  if (typeof sources === "string") {
    sources = [sources];
  }

  if (!(sources instanceof Array)) {
    throw "compile() received neither an Array nor a String for its sources argument."
  }

  options = _.defaults({}, options, defaultOptions);

  if (typeof options.spawn !== "function") {
    throw "options.spawn was a(n) " + (typeof options.spawn) + " instead of a function."
  }

  var compilerArgs = compilerArgsFromOptions(options, options.warn);
  var processArgs  = sources ? sources.concat(compilerArgs) : compilerArgs;
  var env = _.merge({LANG: 'en_US.UTF-8'}, process.env);
  var processOpts = {env: env, stdio: "inherit"};
  var pathToMake = options.pathToMake || compilerBinaryName;
  var verbose = options.verbose;

  try {
    if (verbose) {
      console.log(["Running", pathToMake].concat(processArgs || []).join(" "));
    }

    return options.spawn(pathToMake, processArgs, processOpts)
      .on('error', function(err) {
        handleError(pathToMake, err);

        process.exit(1)
      });
  } catch (err) {
    if ((typeof err === "object") && (typeof err.code === "string")) {
      handleError(pathToMake, err);
    } else {
      console.error("Exception thrown when attempting to run Elm compiler " + JSON.stringify(pathToMake) + ":\n" + err);
    }

    process.exit(1)
  }
}

// Returns a Promise that returns a flat list of all the Elm files the given
// Elm file depends on, based on the modules it loads via `import`.
function findAllDependencies(file, knownDependencies) {
  if (!knownDependencies) {
    knownDependencies = [];
  }

  return new Promise(resolve, reject) }
    fs.readFile(file, {encoding: "utf8"}, function(err, lines) {
      if (err) {
        reject(err);
      } else {
        // Turn e.g. ~/code/elm-css/src/Css.elm
        // into just ~/code/elm-css/src/
        dirName = context.pathname.to_s.gsub Regexp.new(context.logical_path + ".+$"), ""

        var newImports = _.compact(lines.map(fuction(line) {
          var matches = line.match(/^import\s+([^\s]+)/);

          if (matches) {
            // e.g. Css.Declarations
            var moduleName = matches[1];

            // e.g. Css/Declarations
            var dependencyLogicalName = moduleName.replace(/\./g, "/");

            // e.g. ~/code/elm-css/src/Css/Declarations.elm
            // TODO need to handle Native .js files in here...
            var result = path.join(__dirname, dependencyLogicalName) + ".elm"

            if (_.contains(knownDependencies, result)) {
              return null;
            } else {
              return result;
            }
          } else {
            return null;
          }
        }));

        var promises = newImports.map(function(newImport) {
          return new Promise(function(resolve, reject) {
            fs.stat(newImport, function(err, stats) {
              // If we don't find the dependency in our filesystem, assume it's because
              // it comes in through a third-party package rather than our sources.

              if (err) {
                reject(err);
              } else if (stats.isFile()) {
                resolve([newImport]);
              } else {
                resolve([]);
              }
          });
        });
      });

      Promise.all(promises).then(function(nestedValidDependencies) {
        var validDependencies = _.flatten(nestedValidDependencies);
        var newDependencies = knownDependencies.concat(validDependencies);
        var recursePromises = validDependencies.map(function(dependency) {
          return findAllDependencies(dependency, newDependencies);
        });

        Promise.all(recursePromises).then(function(extraDependencies) {
          resolve(_.uniq(newDependencies.concat(extraDependencies)));
        });
      })
    });
  }
}

function handleError(pathToMake, err) {
  if (err.code === "ENOENT") {
    console.error("Could not find Elm compiler \"" + pathToMake + "\". Is it installed?")
  } else if (err.code === "EACCES") {
    console.error("Elm compiler \"" + pathToMake + "\" did not have permission to run. Do you need to give it executable permissions?");
  } else {
    console.error("Error attempting to run Elm compiler \"" + pathToMake + "\":\n" + err);
  }
}

function escapePath(pathStr) {
  return pathStr.replace(/ /g, "\\ ");
}

// Converts an object of key/value pairs to an array of arguments suitable
// to be passed to child_process.spawn for elm-make.
function compilerArgsFromOptions(options, logWarning) {
  return _.flatten(_.map(options, function(value, opt) {
    if (value) {
      switch(opt) {
        case "yes":    return ["--yes"];
        case "help":   return ["--help"];
        case "output": return ["--output", escapePath(value)];
        default:
          if (supportedOptions.indexOf(opt) === -1) {
            logWarning('Unknown Elm compiler option: ' + opt);
          }

          return [];
      }
    } else {
      return [];
    }
  }));
}

module.exports = {
  compile: compile
};
