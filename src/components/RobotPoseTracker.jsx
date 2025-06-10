import React, { useEffect, useRef } from "react";
import ROSLIB from "roslib";
import ROS2D from "ros2d";
import Config from "../scripts/Config";

const RobotPoseTracker = ({ ros }) => {
  const viewerRef = useRef(null);
  const stageRef = useRef(null);
  const robotRef = useRef(null);

  useEffect(() => {
    if (!ros) return;

    // إنشاء واجهة عرض الخريطة
    const viewer = new ROS2D.Viewer({
      divID: "map",
      width: 500,
      height: 500,
    });
    viewerRef.current = viewer;

    // تحميل الخريطة من `map_server`
    const gridClient = new ROS2D.OccupancyGridClient({
      ros,
      rootObject: viewer.scene,
      continuous: true,
    });

    gridClient.on("change", () => {
      viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
      viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
    });

    // أضف طبقة لحركة الروبوت
    stageRef.current = new createjs.Container();
    viewer.scene.addChild(stageRef.current);

    // تحميل صورة الروبوت
    const robot = new ROS2D.Image({
      image: "../images/robot.png", // استبدل بمسار الصورة
      width: 0.5,
      height: 0.5,
    });
    robotRef.current = robot;
    stageRef.current.addChild(robot);

    // الاشتراك في `odom` لتحديث موضع الروبوت
    const odomListener = new ROSLIB.Topic({
      ros,
      name: Config.ODOM_TOPIC,
      messageType: Config.ODOM_MSG_TYPE,
    });

    odomListener.subscribe((message) => {
      const { x, y } = message.pose.pose.position;
      robot.x = x;
      robot.y = -y; // عكس الإحداثيات حسب الخريطة
      robot.rotation = (message.pose.pose.orientation.z * 180) / Math.PI; // تحويل إلى درجات
      stageRef.current.update();
    });

    return () => {
      odomListener.unsubscribe();
    };
  }, [ros]);

  return <div id="map" style={{ width: "500px", height: "500px" }}></div>;
};

export default RobotPoseTracker;
