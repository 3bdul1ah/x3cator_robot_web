# ROS2 Web Interface

A modern web-based interface for ROS2 (Robot Operating System) visualization and control. This interface provides real-time visualization of robot data, including 3D maps, point clouds, and camera feeds, along with interactive controls.

## Features

- **3D Visualization**
  - Real-time point cloud visualization
  - 2D map overlay on 3D grid
  - Interactive camera controls
  - Robot model visualization

- **Camera Interface**
  - Live camera feed
  - PTZ (Pan-Tilt-Zoom) controls
  - Camera stream optimization

- **Map Visualization**
  - 2D occupancy grid map
  - 3D point cloud visualization
  - Interactive map controls

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- ROS2 (Humble or newer)
- rosbridge_suite
- tf2_web_republisher

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ros-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## ROS2 Setup

1. Install required ROS2 packages:
```bash
sudo apt-get install ros-humble-rosbridge-suite
sudo apt-get install ros-humble-tf2-web-republisher
```

2. Launch the ROS2 bridge:
```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

3. Launch the TF2 web republisher:
```bash
ros2 launch tf2_web_republisher tf2_web_republisher.launch.py
```

## Configuration

The application can be configured through the `src/scripts/Config.js` file:

```javascript
const Config = {
    ROSBRIDGE_SERVER_IP: "localhost",
    ROSBRIDGE_SERVER_PORT: "9090",
    MAP_TOPIC: "/map",
    POINTCLOUD_TOPIC: "/livox/lidar",
    CAMERA_TOPIC: "/camera/image_raw/compressed",
    TF_FIXED_FRAME: "odom"
}
```

## Usage

1. Start the ROS2 bridge and TF2 web republisher
2. Launch the web application
3. Open your browser to `http://localhost:3000`
4. The interface will automatically connect to ROS2 and begin displaying data

## Components

- **ThreeDMap**: 3D visualization component for maps and point clouds
- **Camera**: Camera feed and PTZ control interface
- **Map**: 2D map visualization and navigation
- **RosConnection**: ROS2 bridge connection management

## Development

### Project Structure
```
ros-web/
├── src/
│   ├── components/     # React components
│   ├── scripts/        # Configuration and utilities
│   ├── style/         # CSS styles
│   └── images/        # Static images
├── public/            # Public assets
└── package.json       # Dependencies and scripts
```

### Building for Production

```bash
npm run build
```

The build output will be in the `build` directory.

## Dependencies

This project relies on several key libraries:

- [roslibjs](https://github.com/pac48/roslibjs) - ROS2 JavaScript client library
- [ros2djs](https://github.com/Neoplanetz/ros2djs-ros2) - 2D visualization library for ROS2
- [ros3djs](https://github.com/RobotWebTools/ros3djs) - 3D visualization library for ROS2
- [rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite) - WebSocket interface for ROS2
- [tf2_web_republisher](https://github.com/pac48/tf2_web_republisher) - TF2 republisher for web visualization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ROS2 community](https://docs.ros.org/)
- [RobotWebTools](https://github.com/RobotWebTools)
- [Three.js](https://threejs.org/)
- [React](https://reactjs.org/)
- [pac48](https://github.com/pac48) for ROS2 web tools contributions
