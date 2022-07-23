const StyleDictionary = require("style-dictionary");
const tokens = require("./tokens");

module.exports = {
  source: [`tokens/**/*.json`],
  platforms: {
    scss: {
      buildPath: "src/scss/tokens/",
      files: tokens.map((tokenCategory) => ({
        destination: `_tokens_${tokenCategory}.scss`,
        format: "css/variables",
        filter: {
          attributes: {
            category: "color",
            theme: tokenCategory,
          },
        },
      })),
    },
    //@TODO make custom transfrom for color map nesting
    // css: {
    //   buildPath: "src/scss/tokens/",
    //   files: [
    //     {
    //       destination: "_tokens_map.scss",
    //       format: "scss/map-deep",
    //       filter: {
    //         attributes: {
    //           category: "color",
    //           theme: "color",
    //           channel: false,
    //         },
    //       },
    //     },
    //   ],
    // },
  },
};
