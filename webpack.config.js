const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
 
module.exports = {
    
};

module.exports = {
  target: 'web',
  entry: {
    client: './src/client.ts',
    merchant: './src/merchant.ts',
    "basic-example": './src/basic-example.ts'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: { 
        "stream": require.resolve("stream-browserify"), 
        "buffer": require.resolve("buffer/")
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/index.html', filename: 'index.html' }),
    new HtmlWebpackPlugin({ template: 'src/client.html', filename: 'client.html' }),
    new HtmlWebpackPlugin({ template: 'src/merchant.html', filename: 'merchant.html' }),
    new HtmlWebpackPlugin({ template: 'src/basic-example.html', filename: 'basic-example.html' }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "node_modules/highlight.js/styles/atom-one-dark.css")
        }
      ]
    })
  ]
};