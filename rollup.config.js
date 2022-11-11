import * as multiEntry from "rollup-plugin-multi-entry";
//@TODO enable preview or disable server
// import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import * as fg from "fast-glob";
import babel from "@rollup/plugin-babel";
import postcss from 'rollup-plugin-postcss'
import alias from "@rollup/plugin-alias";

//detect if rollup is in dev env
const devEnv = process.env.ROLLUP_WATCH;

const components = fg.sync([
    "./src/components/**/*.js",
    "./src/components/**/*.jsx"
]);
const helpers = fg.sync([
    "./src/helpers/**/*.js",
    "./src/helpers/**/*.jsx"
]);

const externals = [
  "preact",
  "preact-compat",
  "prop-types",
  "util",
  "debug",
  "react-router-dom",
  "react-router",
  "lodash",
];
const externalRegexen = externals.map((id) => new RegExp(id));

const notified = {};
function external(id) {
  let t = externalRegexen.find((i) => i.test(id));
  if (!t && !notified[id]) {
    notified[id] = true;
    console.log("including in bundle: ", id);
  }
  return t;
}

module.exports = [
  {
    input: [...components, ...helpers, "./src/scss/app.scss"],
    external,
    watch: true,
    output: {
      dir: "dist/",
      entryFileNames: "[name].js",
      format: "esm",
        },
    // presets: [ "preact" ],
    plugins: plugins(),
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
  },
];

function plugins() {
  return [
    // multiEntry(),
    alias({
      entries: [
        { find: "react", replacement: "preact/compat" },
        { find: "react-dom", replacement: "preact/compat" },
      ],
    }),
      resolve({
        extensions: ['.js', '.jsx']
      }),
    babel({
      exclude: "node_modules/**",
    }),
      commonjs({ include: /node_modules/ }),
      postcss({
      preprocessor: (content, id) => new Promise((resolve, reject) => {
        const result = sass.renderSync({ file: id })
        resolve({ code: result.css.toString() })
      }),
      sourceMap: true,
      extensions: ['.sass','.css'],
      extract: "plum.css",
    }),
    // serve({
    //   open: true,
    //   verbose: true,
    //   contentBase: ["", "public"],
    //   host: "localhost",
    //   port: 3000,
    // }),
    devEnv && livereload({ watch: "dist" }),
  ];
}
