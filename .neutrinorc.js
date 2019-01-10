const decorators = require.resolve('babel-plugin-transform-decorators-legacy');

const babelWithDecorators = (neutrino) => { return neutrino.config.module.
  rule('compile').
  use('babel').
  tap(options => {
    options.plugins.unshift(decorators)
    return options
  } )
};

const styles = ['@neutrinojs/style-loader',{
  test: /\.(css|sass|scss)$/,
  moduleTest: /\.module\.(css|sass|scss)$/,
  hot: true,
  loaders: [
    // Define loaders as objects. Note: loaders must be specified in reverse order.
    // ie: for the loaders below the actual execution order would be:
    // input file -> sass-loader -> postcss-loader -> css-loader -> style-loader/mini-css-extract-plugin
    {
      loader: 'postcss-loader',
      options: {
        plugins: [require('autoprefixer')]
      }
    },
    {
      loader: 'sass-loader',
      useId: 'sass',
      options: {
        includePaths: ['absolute/path/a', 'absolute/path/b']
      }
    }
  ]
}];

module.exports = {
  env: {
    NODE_ENV: {
      // Require minify middleware during production
      development: { use: [
        '@neutrinojs/react-components',
        styles,
        babelWithDecorators
      ] },
      production: { use: [
          '@neutrinojs/react-components',
          styles,
          babelWithDecorators
      ] },
      test: { use: [
          '@neutrinojs/node',
          '@neutrinojs/react-components',
          styles,
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

