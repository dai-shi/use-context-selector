// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { DIR, EXT = 'ts' } = process.env;

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: `./examples/${DIR}/src/index.${EXT}`,
  output: {
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `./examples/${DIR}/public/index.html`,
    }),
  ],
  module: {
    rules: [{
      test: /\.[jt]sx?$/,
      exclude: /node_modules/,
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'use-context-selector': `${__dirname}/src`,
    },
  },
  devServer: {
    port: process.env.PORT || '8080',
    static: {
      directory: `./examples/${DIR}/public`,
    },
    historyApiFallback: true,
  },
};
