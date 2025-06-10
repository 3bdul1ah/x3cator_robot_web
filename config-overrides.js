const path = require("path");

module.exports = function override(config) {
    config.resolve.alias = {
        ...config.resolve.alias,
        roslib: path.resolve(__dirname, "public/js/roslibjs/dist/RosLib.js"),
    };
    return config;
};
