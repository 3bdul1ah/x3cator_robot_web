import React, { useState, useEffect, useRef, useCallback } from "react";
import { Container, Row, Col, Card, Button, ButtonGroup } from "react-bootstrap";
import Teleoperation from "./Teleoperation";
import ThreeDMap from "./ThreeDMap";
import Camera from "./Camera";
import RosConnectionLegacy, { ros } from "./RosConnection";
import * as ROSLIB from "roslib";
import * as ROS2D from "ros2d";
import Config from "../scripts/Config";
import robotImage from "../images/robot.png";
import GasSensorPanel from "./GasSensorPanel";
import "../style/dashboard.css";
import 'createjs-module'; // Import createjs module

// Make createjs available globally if it's not already
const createjs = window.createjs || {};

// Throttle function for limiting update frequency
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const Home = () => {
  // Connection state for conditional rendering
  const [connected, setConnected] = useState(false);
  // Map state
  const [mapView, setMapView] = useState('2d'); // '2d' or '3d'
  const [mapAvailable, setMapAvailable] = useState(false);
  const viewerRef = useRef(null);
  const gridClientRef = useRef(null);
  const robotMarkerRef = useRef(null);
  const pathRef = useRef([]);
  
  // Topic references to prevent recreation on every render
  const topicRefs = useRef({
    map: null,
    odom: null
  });

  // Add state for emergency stop button
  const [cmdVel, setCmdVel] = useState(null);

  // Add state for velocity tracking - separate commanded and actual velocities
  const [velocity, setVelocity] = useState({
    command: {
      linear: 0,
      angular: 0
    },
    actual: {
      linear: 0,
      angular: 0
    },
    // Track which type of velocity to display
    displayMode: 'command' // 'command' or 'actual'
  });

  // Subscribe to connection status
  useEffect(() => {
    if (!ros) return;

    const handleConnection = () => {
      setConnected(true);
    };

    const handleDisconnection = () => {
      setConnected(false);
    };

    ros.on('connection', handleConnection);
    ros.on('error', handleDisconnection);
    ros.on('close', handleDisconnection);

    // Check current state
    if (ros.isConnected) {
      setConnected(true);
    }

    return () => {
      ros.off('connection', handleConnection);
      ros.off('error', handleDisconnection);
      ros.off('close', handleDisconnection);
    };
  }, []);

  // Initialize 2D map with memoized map topic
  useEffect(() => {
    if (!ros) return;
    
    // Only create map topic if it doesn't exist
    if (!topicRefs.current.map) {
      topicRefs.current.map = new ROSLIB.Topic({
        ros: ros,
        name: Config.MAP_TOPIC,
        messageType: Config.MAP_MSG_TYPE,
      });

      const mapCallback = (message) => {
        if (message) {
          setMapAvailable(true);
          // Don't unsubscribe to stay updated on map changes
        }
      };

      topicRefs.current.map.subscribe(mapCallback);
    }

    return () => {
      // Unsubscribe only when component unmounts
      if (topicRefs.current.map) topicRefs.current.map.unsubscribe();
    };
  }, []);

  // Initialize 2D map viewer and robot position tracking
  useEffect(() => {
    if (!mapAvailable || !ros || mapView !== '2d') return;
    
    const mapContainer = document.getElementById("map-container");
    if (!mapContainer) return;
    
    // Initialize the ROS2D viewer
    const viewer = new ROS2D.Viewer({
      divID: "map-container",
      width: mapContainer.clientWidth,
      height: mapContainer.clientHeight || 300,
      background: '#0a0a0c'
    });
    viewerRef.current = viewer;

    // Setup the map client
    const gridClient = new ROS2D.OccupancyGridClient({
      ros: ros,
      rootObject: viewer.scene,
      continuous: true,
    });
    gridClientRef.current = gridClient;

    gridClient.on("change", () => {
      if (gridClient.currentGrid) {
        viewer.scaleToDimensions(gridClient.currentGrid.width * 1.6, gridClient.currentGrid.height * 0.6);
        viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
      }
    });

    // Create and add the robot marker
    const robotMarker = new ROS2D.NavigationImage({
      size: 1,
      image: robotImage,
    });
    robotMarkerRef.current = robotMarker;

    gridClient.rootObject.addChild(robotMarker);
    robotMarker.rotation = -90;

    // Only create the odom topic if it doesn't exist
    if (!topicRefs.current.odom) {
      topicRefs.current.odom = new ROSLIB.Topic({
        ros: ros,
        name: Config.ODOM_TOPIC,
        messageType: Config.ODOM_MSG_TYPE,
        throttle_rate: 200 // Limit to 5 updates per second
      });
    }

    const odomCallback = throttle((message) => {
      if (!robotMarkerRef.current) return;
      
      const { x, y } = message.pose.pose.position;
      const { z, w } = message.pose.pose.orientation;
      const theta = 2 * Math.atan2(z, w);

      // Update robot position
      robotMarkerRef.current.x = x;
      robotMarkerRef.current.y = -y;
      robotMarkerRef.current.rotation = (theta * 180) / Math.PI - 90;

      // Draw path
      const newPathPoint = { x, y: -y };
      pathRef.current.push(newPathPoint);
      
      // Limit path length to prevent performance issues
      if (pathRef.current.length > 30) { // Reduced from 50 to 30 points
        pathRef.current.shift();
      }
      
      // Draw path
      drawPath();
    }, 200); // Limit path updates to 5 per second
    
    topicRefs.current.odom.subscribe(odomCallback);

    // Handle window resize
    const handleResize = throttle(() => {
      if (viewerRef.current) {
        const container = document.getElementById("map-container");
        if (container) {
          viewerRef.current.resize(container.clientWidth, container.clientHeight || 300);
        }
      }
    }, 200);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      // Don't unsubscribe from odom here - we'll handle that in component unmount
    };
  }, [mapAvailable, mapView]);

  // Function to draw the robot's path
  const drawPath = useCallback(() => {
    // Clear previous path
    if (viewerRef.current && viewerRef.current.scene.getChildByName("robotPath")) {
      viewerRef.current.scene.removeChild(viewerRef.current.scene.getChildByName("robotPath"));
    }
    
    if (pathRef.current.length < 2) return;
    
    // Create path graphics
    const pathGraphics = new createjs.Shape();
    pathGraphics.name = "robotPath";
    pathGraphics.graphics.setStrokeStyle(0.05).beginStroke("rgba(230, 57, 70, 0.7)");
    
    // Draw path line
    pathGraphics.graphics.moveTo(pathRef.current[0].x, pathRef.current[0].y);
    for (let i = 1; i < pathRef.current.length; i++) {
      pathGraphics.graphics.lineTo(pathRef.current[i].x, pathRef.current[i].y);
    }
    
    // Add path to scene
    if (viewerRef.current) {
      viewerRef.current.scene.addChild(pathGraphics);
    }
  }, []);

  // Set up emergency stop command topic
  useEffect(() => {
    if (!ros || !ros.isConnected) return;
    
    // Set up cmd_vel topic for emergency stop
    const topic = new ROSLIB.Topic({
      ros: ros,
      name: Config.CMD_VEL_TOPIC,
      messageType: "geometry_msgs/msg/Twist",
    });
    setCmdVel(topic);
    
    return () => {
      // Clean up when component unmounts
      if (topic) {
        topic.unadvertise();
      }
    };
  }, [connected]);

  // Emergency stop handler
  const handleEmergencyStop = () => {
    if (!cmdVel) return;
    
    const twist = {
      linear: { x: 0.0, y: 0.0, z: 0.0 },
      angular: { x: 0.0, y: 0.0, z: 0.0 },
    };
    
    cmdVel.publish(twist);
    
    // Publish multiple times to ensure the command is received
    setTimeout(() => cmdVel.publish(twist), 100);
    setTimeout(() => cmdVel.publish(twist), 200);
    
    console.log("Emergency stop activated");
  };

  useEffect(() => {
    // Handle ESC key press for exiting camera fullscreen mode
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        const cameraWrapper = document.querySelector('.camera-wrapper.fullscreen');
        if (cameraWrapper) {
          cameraWrapper.classList.remove('fullscreen');
          document.body.style.overflow = 'auto';
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Add effect to subscribe to cmd_vel topic and update velocity display
  useEffect(() => {
    if (!ros || !ros.isConnected) return;
    
    // Create cmd_vel subscription to monitor velocity commands
    const cmdVelListener = new ROSLIB.Topic({
      ros: ros,
      name: Config.CMD_VEL_TOPIC,
      messageType: 'geometry_msgs/msg/Twist'
    });
    
    const cmdVelCallback = (message) => {
      const linearX = message.linear.x;
      const angularZ = message.angular.z;
      
      // Update command velocity state
      setVelocity(prev => ({
        ...prev,
        command: {
          linear: linearX,
          angular: angularZ
        }
      }));
      
      // Update command velocity display elements
      updateCommandVelocityDisplay(linearX, angularZ);
    };
    
    // Subscribe to odometry to get actual velocities
    const odomListener = new ROSLIB.Topic({
      ros: ros,
      name: Config.ODOM_TOPIC,
      messageType: Config.ODOM_MSG_TYPE,
      throttle_rate: 100 // Update at most 10 times per second
    });
    
    const odomCallback = (message) => {
      // Extract actual velocity from odometry message
      const actualLinear = message.twist.twist.linear.x;
      const actualAngular = message.twist.twist.angular.z;
      
      // Update actual velocity state
      setVelocity(prev => ({
        ...prev,
        actual: {
          linear: actualLinear,
          angular: actualAngular
        }
      }));
      
      // Update actual velocity display elements
      updateActualVelocityDisplay(actualLinear, actualAngular);
    };
    
    // Helper function to update command velocity display
    const updateCommandVelocityDisplay = (linearX, angularZ) => {
      const linearElement = document.getElementById('cmd-linear-velocity-value');
      const angularElement = document.getElementById('cmd-angular-velocity-value');
      
      if (linearElement) {
        linearElement.textContent = `${linearX.toFixed(2)} m/s`;
        
        // Add or remove active class based on value
        if (Math.abs(linearX) > 0.01) {
          linearElement.classList.add('active');
        } else {
          linearElement.classList.remove('active');
        }
      }
      
      if (angularElement) {
        angularElement.textContent = `${angularZ.toFixed(2)} rad/s`;
        
        // Add or remove active class based on value
        if (Math.abs(angularZ) > 0.01) {
          angularElement.classList.add('active');
        } else {
          angularElement.classList.remove('active');
        }
      }
    };
    
    // Helper function to update actual velocity display
    const updateActualVelocityDisplay = (linearX, angularZ) => {
      const linearElement = document.getElementById('act-linear-velocity-value');
      const angularElement = document.getElementById('act-angular-velocity-value');
      
      if (linearElement) {
        linearElement.textContent = `${linearX.toFixed(2)} m/s`;
        
        // Add or remove active class based on value
        if (Math.abs(linearX) > 0.01) {
          linearElement.classList.add('active');
        } else {
          linearElement.classList.remove('active');
        }
      }
      
      if (angularElement) {
        angularElement.textContent = `${angularZ.toFixed(2)} rad/s`;
        
        // Add or remove active class based on value
        if (Math.abs(angularZ) > 0.01) {
          angularElement.classList.add('active');
        } else {
          angularElement.classList.remove('active');
        }
      }
    };
    
    cmdVelListener.subscribe(cmdVelCallback);
    odomListener.subscribe(odomCallback);
    
    return () => {
      cmdVelListener.unsubscribe();
      odomListener.unsubscribe();
    };
  }, [ros, connected]);

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <Container fluid className="px-2">
          {/* Connection Status - More Compact */}
          <div className="connection-status-card mb-2">
            <div className="system-status">
              <i className="bi bi-hdd-network system-status-icon"></i>
              <div className="system-status-text">
                <RosConnectionLegacy />
              </div>
            </div>
          </div>

          <Row className="g-2">
            {/* Row 1: X3CATOR-R Robot | Gas Readings */}
            <Col md={6} className="d-flex">
              {/* Robot Showcase */}
              <Card className="mb-2 w-100">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-robot me-2"></i>X3CATOR-R Robot</h5>
                </Card.Header>
                <Card.Body className="p-2">
                  <div className="robot-showcase">
                    <div className="robot-image-container">
                      <img 
                        src={robotImage} 
                        alt="X3CATOR-R Firefighter Robot"
                        className="robot-image"
                        style={{ height: '400px', width: 'auto' }}
                      />
                      <button 
                        className="emergency-stop-btn" 
                        onClick={handleEmergencyStop}
                        title="Emergency Stop (cmd_vel = 0)"
                      >
                        <i className="bi bi-exclamation-octagon-fill"></i> <span>EMERGENCY STOP</span>
                      </button>
                    </div>
                    <div className="robot-info">
                      <div>
                        <h4 className="mb-1 text-bright" style={{ fontSize: '28px' }}>X3CATOR-<span style={{ color: '#e63946' }}>R</span></h4>
                        <p className="text-medium mb-3" style={{ fontSize: '18px' }}>Advanced Firefighting Robot</p>
                      </div>
                      <div className="robot-teleop mt-3">
                        <h6 className="mb-2"><i className="bi bi-joystick me-2"></i>Robot Control</h6>
                        <div className="robot-control-wrapper">
                          {/* Left side - Teleop controls */}
                          <div className="teleop-controls-container">
                            {/* Control pad */}
                            <div className="compact-teleop">
                              <Teleoperation isCompact={true} />
                            </div>
                            
                            {/* Velocity display panel */}
                            <div className="velocity-panel">
                              <div className="velocity-header">
                                <i className="bi bi-speedometer2 me-1"></i>
                                <span>Velocity</span>
                              </div>
                              <div className="velocity-row">
                                <div className="velocity-label">Linear:</div>
                                <div className="velocity-value" id="cmd-linear-velocity-value">
                                  {velocity.command.linear.toFixed(2)} m/s
                                </div>
                                <div className="velocity-label">Angular:</div>
                                <div className="velocity-value" id="cmd-angular-velocity-value">
                                  {velocity.command.angular.toFixed(2)} rad/s
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - Speed slider */}
                          <div className="teleop-speed-slider">
                            <div className="speed-label">Speed</div>
                            <div className="speed-level">
                              <span className="level-indicator high">Fast</span>
                              <div className="vertical-slider-container">
                                <input
                                  type="range"
                                  min="0.1"
                                  max="1.0"
                                  step="0.1"
                                  defaultValue="0.6"
                                  className="vertical-speed-slider"
                                  orient="vertical"
                                  onChange={(e) => {
                                    // Find the Teleoperation component and update its speed
                                    const teleopComponent = document.querySelector('.teleop-container');
                                    if (teleopComponent) {
                                      const event = new CustomEvent('speed-change', { 
                                        detail: { speed: parseFloat(e.target.value) } 
                                      });
                                      teleopComponent.dispatchEvent(event);
                                      
                                      // Update speed level indicators
                                      const value = parseFloat(e.target.value);
                                      document.querySelectorAll('.level-indicator').forEach(el => {
                                        el.classList.remove('active');
                                      });
                                      
                                      if (value >= 0.7) {
                                        document.querySelector('.level-indicator.high').classList.add('active');
                                      } else if (value >= 0.4) {
                                        document.querySelector('.level-indicator.medium').classList.add('active');
                                      } else {
                                        document.querySelector('.level-indicator.low').classList.add('active');
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <span className="level-indicator medium active">Normal</span>
                              <span className="level-indicator low">Slow</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} className="d-flex">
              {/* Replace the Gas readings panel with GasSensorPanel */}
              <Card className="mb-2 w-100">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-cloud me-2"></i>Gas Readings</h5>
                </Card.Header>
                <Card.Body className="p-0" style={{ flex: '1 1 auto' }}>
                  <div className="home-gas-panel-wrapper">
                    <GasSensorPanel compact={true} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Row 2: Camera Feed | Robot Environment */}
            <Col md={6} className="d-flex">
              {/* Camera Feed replaces Teleoperation */}
              <Card className="mb-2 w-100">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-camera-video me-2"></i>Camera Feed</h5>
                  <span 
                    className="card-action"
                    onClick={() => {
                      const cameraWrapper = document.querySelector('.camera-wrapper');
                      if (cameraWrapper) {
                        if (cameraWrapper.classList.contains('fullscreen')) {
                          cameraWrapper.classList.remove('fullscreen');
                          document.body.style.overflow = 'auto';
                        } else {
                          cameraWrapper.classList.add('fullscreen');
                          document.body.style.overflow = 'hidden';
                        }
                      }
                    }}
                    title="Toggle fullscreen"
                  >
                    <i className="bi bi-arrows-fullscreen"></i>
                  </span>
                </Card.Header>
                <Card.Body className="p-0" style={{ flex: '1 1 auto' }}>
                  <div className="home-camera-container">
                    <div className="camera-wrapper camera-small">
                      {connected ? (
                        <Camera />
                      ) : (
                        <div className="loading-placeholder">
                          <i className="bi bi-camera-video-off"></i>
                          <div className="text-bright">Camera feed unavailable</div>
                          <div className="text-medium small">Waiting for connection...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} className="d-flex">
              {/* Robot Environment with 3D view only */}
              <Card className="mb-2 w-100">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-box me-2"></i>Robot Environment</h5>
                </Card.Header>
                <Card.Body className="p-0" style={{ flex: '1 1 auto' }}>
                  <div className="environment-wrapper" style={{ height: '100%' }}>
                    {connected ? (
                      <ThreeDMap />
                    ) : (
                      <div className="loading-placeholder small-placeholder">
                        <i className="bi bi-grid-3x3-gap"></i>
                        <div className="text-bright">3D Environment unavailable</div>
                        <div className="text-medium small">Waiting for connection...</div>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Home;

