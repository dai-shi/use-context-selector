// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { DIR, EXT = 'ts' } = process.env;

module.exports = {
  mode: 'development',
  entry: `./examples/${DIR}/src/index.${EXT}`,
  plugins: [
    new HtmlWebpackPlugin({
      template: `./examples/${DIR}/public/index.html`,
    }),
  ],
  module: {
    rules: [{
      test: /\.jsx?/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react',
          ],
        },
      }],
    }, {
      test: /\.tsx?/,
      loader: 'ts-loader',
    }],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'use-context-selector': __dirname,
    },
  },
  devServer: {
    port: process.env.PORT || '8080',
  },
};
