import React, { Component, use } from 'react';

import * as ROSLIB from 'roslib';import * as ROS2D from 'ros2d';
import * as ROS3D from 'ros3d';

export default class RosLibs extends Component {
    componentDidMount() {
        console.log({ ROSLIB });
        console.log({ ROS2D });
        console.log({ ROS3D });
    }

    render() {
        return null;
    }
}
