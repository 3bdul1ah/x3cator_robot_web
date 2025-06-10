import React, { useState, useEffect } from 'react';
import * as ROSLIB from 'roslib';
import Config from '../scripts/Config';
import '../style/RosConnection.css';

// Create a ROS instance that can be used by other components
const ros = new ROSLIB.Ros({
  groovyCompatibility: true,
});

// This component is used for connecting to ROS
// We keep this for backwards compatibility with existing components
// The Teleoperation component now uses its own RosConnection from rosreact
const RosConnectionLegacy = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log("Initializing ROS connection...");

    const connect = () => {
      try {
        ros.connect(`ws://${Config.ROSBRIDGE_SERVER_IP}:${Config.ROSBRIDGE_SERVER_PORT}`);
      } catch (error) {
        console.error("Connection Problem:", error);
      }
    };

    ros.on("connection", () => {
      console.log("Connected to websocket server");
      setConnected(true);
    });

    ros.on("error", (error) => {
      console.log("Error connecting:", error);
      setConnected(false);
    });

    ros.on("close", () => {
      console.log("Connection closed. Reconnecting...");
      setConnected(false);
      setTimeout(connect, Config.RECONNECTION_TIMER);
    });

    connect();

    return () => {
      console.log("Closing ROS connection...");
      ros.close();
    };
  }, []);

  return (
    <div className={`connection-status-pill ${connected ? 'connected' : 'disconnected'}`}>
      <i className={`bi ${connected ? 'bi-wifi' : 'bi-wifi-off'} status-icon ${connected ? 'connected' : 'disconnected'}`}></i>
      <span className="status-text">{connected ? "Robot Connected" : "Robot Disconnected"}</span>
    </div>
  );
};

export { ros };
export default RosConnectionLegacy;