import React, { useEffect, useRef, useState } from "react";
import * as ROS3D from "ros3d";
import * as ROSLIB from "roslib";
import { ros } from "./RosConnection"; 
import * as THREE from "three";
import Config from "../scripts/Config";

const ThreeDMap = () => {
  const viewerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // Initialize pointcloud check
  useEffect(() => {
    if (!ros || !ros.isConnected) {
      setError("ROS connection not available");
      return;
    }

    setError(null);

    const pointCloudTopic = new ROSLIB.Topic({
      ros,
      name: Config.POINTCLOUD_TOPIC,
      messageType: Config.POINTCLOUD_MSG_TYPE,
    });

    const handleMessage = (msg) => {
      if (msg) {
        setReady(true);
      }
    };

    pointCloudTopic.subscribe(handleMessage);

    return () => pointCloudTopic.unsubscribe();
  }, []);

  // Setup the 3D viewer once we're ready
  useEffect(() => {
    if (!ready || !ros || !ros.isConnected) return;

    try {
      // Clear any existing viewer
      const existingViewer = document.getElementById("viewer");
      if (existingViewer) {
        while (existingViewer.firstChild) {
          existingViewer.removeChild(existingViewer.firstChild);
        }
      }

      const viewer = new ROS3D.Viewer({
        divID: "viewer",
        width: existingViewer.clientWidth,
        height: existingViewer.clientHeight,
        antialias: true,
        background: "#0a0a0c",
      });

      viewerRef.current = viewer;

      // Add Grid
      viewer.addObject(new ROS3D.Grid({ color: "#333333", cellSize: 0.2, num_cells: 20 }));

      // Create TF Client
      const tfClient = new ROSLIB.ROS2TFClient({
        ros,
        fixedFrame: Config.TF_FIXED_FRAME,
        angularThres: 0.01,
        transThres: 0.01,
        rate: 10.0,
      });

      // Add 2D Map
      const mapTopic = new ROSLIB.Topic({
        ros: ros,
        name: Config.MAP_TOPIC,
        messageType: Config.MAP_MSG_TYPE
      });

      mapTopic.subscribe((message) => {
        const map = new ROS3D.OccupancyGrid({
          message: message
        });
        viewer.scene.add(map);
      });

      const pointCloud = new ROS3D.PointCloud2({
        ros,
        tfClient,
        rootObject: viewer.scene,
        topic: Config.POINTCLOUD_TOPIC,
        material: { size: 0.05, color: 0x00ffff }, // Cyan points
        max_pts: 100000,
      });

      // Add Robot Model
      console.log("Setting up URDF client...");
      
      // First check if robot_description parameter exists
      const robotDescription = new ROSLIB.Param({
        ros: ros,
        name: '/robot_description'
      });

      robotDescription.get((urdf) => {
        console.log("Robot description received:", urdf ? "Yes" : "No");
        if (!urdf) {
          console.error("No URDF found in /robot_description parameter");
          return;
        }

        const urdfClient = new ROS3D.UrdfClient({
          ros: ros,
          tfClient: tfClient,
          path: 'http://127.0.0.1:8000/',
          rootObject: viewer.scene
        });

        // Add a simple box as fallback if URDF fails
        const fallbackBox = new ROS3D.Marker({
          ros: ros,
          tfClient: tfClient,
          topic: '/robot_state',
          rootObject: viewer.scene,
          color: 0x00ff00
        });
      });

      // Handle window resize
      const handleResize = () => {
        if (viewerRef.current && existingViewer) {
          viewerRef.current.resize(
            existingViewer.clientWidth,
            existingViewer.clientHeight
          );
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        viewer.scene.children = [];
        tfClient.dispose();
      };
    } catch (e) {
      console.error("Error setting up 3D viewer", e);
      setError("Failed to setup 3D viewer: " + e.message);
    }
  }, [ready]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {ready ? (
        <div
          id="viewer"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "400px",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        />
      ) : (
        <div className="loading-placeholder small-placeholder" style={{ minHeight: "400px" }}>
          <i className="bi bi-grid-3x3-gap"></i>
          <div>
            {error ? (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            ) : (
              "Waiting for point cloud data..."
            )}
          </div>
          <div className="placeholder-details">
            <small>Topic: {Config.POINTCLOUD_TOPIC}</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDMap;