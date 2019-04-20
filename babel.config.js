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
    "@babel/preset-react"
  ],
  plugins: [
    ["module-resolver", {
      "root": ["./src"],
    }],
    // "react-hot-loader/babel",
    ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ["@babel/plugin-proposal-class-properties", { "loose" : true }]
  ]
};

