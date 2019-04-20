import multiEntry from "rollup-plugin-multi-entry";
const commonjs = require("rollup-plugin-commonjs")
const resolve = require("rollup-plugin-node-resolve")
const babel = require("rollup-plugin-babel")

export default { 
  input: "src/components/**/*.js",
  output: {
    dest: "dist/",
    format:'esm',
  },
  external: [ 'react', 'react-dom', 'react-proptypes' ],
  plugins: [
    multiEntry(),
    resolve(),
    babel({
      exclude: 'node_modules/**'
    }),
    commonjs(),
  ]
};

