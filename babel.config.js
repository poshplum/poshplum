// NOTE: This configuration is not used for vite; only for bundling the components into dist/

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    "preact"
  ],
  plugins: [
    ["module-resolver", {
      "root": ["./src"],
      "alias": {
        "react": "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
      },
      }],
     [ "@babel/plugin-transform-react-jsx", {
        "runtime": "automatic",
        "importSource": "preact"
      }],
    // "react-hot-loader/babel",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose" : true }]
  ]
};
