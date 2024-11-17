const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  plugins: [
    new NodePolyfillPlugin()
  ],
  resolve: {
    fallback: {
      "net": require.resolve("node-libs-browser/mock/net"),
      "tls": require.resolve("node-libs-browser/mock/tls"),
      "dns": require.resolve("node-libs-browser/mock/dns"),
      "child_process": false,
      "fs": false,
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "util": require.resolve("util/")
    }
  }
};