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
        width: 600,
        height: 600,
        antialias: true,
        background: "#0a0a0c",
      });

      viewerRef.current = viewer;

      // Add Grid
      viewer.addObject(new ROS3D.Grid({ color: "#333333", cellSize: 0.5, num_cells: 20 }));

      // Create TF Client
      const tfClient = new ROSLIB.ROS2TFClient({
        ros,
        fixedFrame: Config.TF_FIXED_FRAME,
        angularThres: 0.01,
        transThres: 0.01,
        rate: 10.0,
      });

      const pointCloud = new ROS3D.PointCloud2({
        ros,
        tfClient,
        rootObject: viewer.scene,
        topic: Config.POINTCLOUD_TOPIC,
        material: { size: 0.05, color: 0x00ffff }, // Cyan points
        max_pts: 100000,
      });


      
      return () => {
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
            width: "600px",
            height: "600px",
            margin: "0 auto",
            border: "1px solid #333",
          }}
        />
      ) : (
        <div className="loading-placeholder small-placeholder" style={{ minHeight: "300px" }}>
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
