"use strict";

const webpack = require("webpack");
const path = require("path");

// ********************
// Common configuration
// ********************

let config = {
    entry: {
        "js/bundleeee.js": path.resolve(__dirname, "client/js/lounge.js"),
        "js/bundleeee.vendor.js": [
            "handlebars/runtime",
            "socket.io-client",
//            "urijs",
        ],
    },
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, "client"),
        filename: "[name]",
        publicPath: "/"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, "client"),
                ],
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "es2015"
                        ]
                    }
                }
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            },
            {
                test: /\.tpl$/,
                include: [
                    path.resolve(__dirname, "client/views"),
                ],
                use: {
                    loader: "handlebars-loader",
                    options: {
                        helperDirs: [
                            path.resolve(__dirname, "client/js/libs/handlebars")
                        ],
                        extensions: [
                            ".tpl"
                        ],
                    }
                }
            },
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin("js/bundleeee.vendor.js")
    ]
};

// *********************************
// Production-specific configuration
// *********************************

if (process.env.NODE_ENV === "production") {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        comments: false
    }));
} else {
    console.log("Building in development mode, bundles will not be minified.");
}

module.exports = config;
