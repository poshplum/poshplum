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
      ] }
    }
  },
  use: [
    '@neutrinojs/jest',
    '@neutrinojs/react-components'
  ]
}

