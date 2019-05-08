const multiEntry = require("rollup-plugin-multi-entry");
const commonjs = require("rollup-plugin-commonjs")
const resolve = require("rollup-plugin-node-resolve")
const babel = require("rollup-plugin-babel")
const fg = require('fast-glob');
import scss from 'rollup-plugin-scss'

const components = fg.sync(["./src/components/**/*.js"]);
const helpers = fg.sync(["./src/helpers/**/*.js"]);

const externals = [
  'react', 'react-dom', 'prop-types', 'util', 'debug', 'react-router-dom', 'react-router', 'lodash'
];
const externalRegexen = externals.map(id => new RegExp(id));

const notified = {};
function external(id) {
  let t = externalRegexen.find((i) => i.test(id));
  if (!t && !notified[id]) {
    notified[id] = true;
    console.log("including in bundle: ", id);
  }
  return t;
}

module.exports = [{
  input: [...components, ...helpers, "./src/plum-defaults.scss"],
  external,
  output: {
    dir: "dist/",
    entryFileNames: "[name].js",
    format:'esm',
  },
  plugins: plugins()
// },
  // {
  // input: helpers,
  // external,
  // output: {
  //   dir: "dist/helpers/",
  //   entryFileNames: "[name].js",
  //   format:'esm',
  // },
  // plugins: plugins()
}];

function plugins() {
  return [
    // multiEntry(),
    resolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    commonjs(),
    scss({
      output: "dist/plum.css",
      failOnError: true,
    })
  ]
}

