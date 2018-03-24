var webpack = require("webpack");

var config = {
  context: __dirname,
  entry: {
    app: "./index.js"
  },
  mode: "production",
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: { presets: ["env"] }
          }
        ]
      }
    ]
  }
};

module.exports = config;
