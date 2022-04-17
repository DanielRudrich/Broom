const webpack = require("webpack");

const config = {
    entry: "./src/index.ts",
    output: {
        filename: "dist/bundle.js",
        path: __dirname,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    mode: "development",
};

var configApp = Object.assign({}, config, {
    name: "configApp",
    entry: "./src/index.ts",
    output: {
        path: __dirname + "/dist",
        publicPath: "/",
        filename: "main.js",
    },
});

var configProcessor = Object.assign({}, config, {
    name: "configProcessor",
    entry: "./src/sweepProcessor.ts",
    output: {
        path: __dirname + "/dist",
        publicPath: "/",
        filename: "sweepProcessor.js",
    },
    mode: "production",
});

module.exports = [configApp, configProcessor];
