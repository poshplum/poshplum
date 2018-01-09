const decorators = require.resolve('babel-plugin-transform-decorators-legacy');

const babelWithDecorators = (neutrino) => { return neutrino.config.module.
  rule('compile').
  use('babel').
  tap(options => {
    options.plugins.unshift(decorators)
    return options
  } )
};

module.exports = {
  env: {
    NODE_ENV: {
      // Require minify middleware during production
      development: { use: [
        '@neutrinojs/react-components',
        babelWithDecorators
      ] },
      production: { use: [
          '@neutrinojs/react-components',
          babelWithDecorators
      ] },
      test: { use: [
          '@neutrinojs/node',
          '@neutrinojs/react-components',
          babelWithDecorators,
          ['@neutrinojs/jest', {
            // setup script for the framework
            setupTestFrameworkScriptFile: '<rootDir>/test/test-setup.js',
            // and / or shims
            // setupFiles: [
            //   '<rootDir>/shim.js'
            // ]
          }]
        ]
      }
    }
  },
  use: [
     // '@neutrinojs/react-components'
  ]
}

