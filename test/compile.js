var assert = require("chai").assert;
var path = require("path");
var compiler = require(path.join(__dirname, ".."));
var childProcess = require("child_process");
var _ = require("lodash");

var fixturesDir = path.join(__dirname, "fixtures");

function prependFixturesDir(filename) {
  return path.join(fixturesDir, filename);
}

describe("#compile", function() {
  it("works with --yes", function (done) {
    // Use a timeout of 1200 seconds because we need to download packages.
    // (Had 60 seconds before and it timed out on Travis Linux.)
    // (Could probably improve this by explicitly doing a separate elm-package install step.)
    this.timeout(120000);

    var opts = {yes: true, output: "/dev/null", verbose: true, cwd: fixturesDir};
    var compileProcess = compiler.compile(prependFixturesDir("Parent.elm"), opts);

    compileProcess.on("close", function(exitCode) {
      assert.equal(exitCode, 0, "Expected elm-make to have exit code 0");
      done();
    });
  });
});
