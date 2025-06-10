const Config = {
    ROSBRIDGE_SERVER_IP: "localhost",
    ROSBRIDGE_SERVER_PORT: "9090",
    RECONNECTION_TIMER: 1000,
    CMD_VEL_TOPIC: "/cmd_vel",
    MAP_TOPIC: "/map",
    MAP_MSG_TYPE: "nav_msgs/OccupancyGrid",
    ODOM_TOPIC: "/odom",
    ODOM_MSG_TYPE: "nav_msgs/Odometry",
    POINTCLOUD_TOPIC: "/livox/lidar",
    POINTCLOUD_MSG_TYPE: "sensor_msgs/PointCloud2",
    
    // Camera settings
    CAMERA_STREAM_URL: "http://localhost:8080/stream_viewer?topic=/camera/d435/image_raw",
    
    TF_FIXED_FRAME: "odom",
    
    // Gas sensor topics
    CO_TOPIC: "/gas/co",
    H2S_TOPIC: "/gas/h2s",
    O2_TOPIC: "/gas/o2",
    CH4_TOPIC: "/gas/ch4",
    GAS_MSG_TYPE: "std_msgs/Float32"
}

export default Config;
