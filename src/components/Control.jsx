import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab } from 'react-bootstrap';
import RosConnectionLegacy, { ros } from './RosConnection';
import Teleoperation from './Teleoperation';
import Camera from './Camera';
import ThreeDMap from './ThreeDMap';
import * as ROSLIB from 'roslib';
import Config from "../scripts/Config";
import "../style/dashboard.css";

const Control = () => {
  const [activeTab, setActiveTab] = useState('teleop');
  const [velocity, setVelocity] = useState({
    command: {
      linear: 0,
      angular: 0
    },
    actual: {
      linear: 0,
      angular: 0
    }
  });
  const [connected, setConnected] = useState(false);

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

  // Set up velocity monitoring
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
    
    cmdVelListener.subscribe(cmdVelCallback);
    
    return () => {
      cmdVelListener.unsubscribe();
    };
  }, [ros, connected]);

  return (
    <div className="dashboard control-page">
      <div className="dashboard-content">
        <Container fluid className="px-2">
          <h3 className="text-bright mb-3">
            <i className="bi bi-joystick me-2"></i>
            Robot Control Panel
          </h3>
          
          {/* Control Tabs */}
          <Row className="g-2">
            <Col lg={12}>
              <Card className="mb-2">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-controller me-2"></i>Control Interface</h5>
                </Card.Header>
                <Card.Body className="p-2">
                  <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                    <Nav variant="tabs" className="mb-3">
                      <Nav.Item>
                        <Nav.Link 
                          eventKey="teleop"
                          className={activeTab === 'teleop' ? 'active' : ''}
                        >
                          <i className="bi bi-badge-3d me-1"></i> 3D View
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link 
                          eventKey="actions"
                          className={activeTab === 'actions' ? 'active' : ''}
                        >
                          <i className="bi bi-lightning me-1"></i> Actions
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link 
                          eventKey="settings"
                          className={activeTab === 'settings' ? 'active' : ''}
                        >
                          <i className="bi bi-gear me-1"></i> Settings
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                    
                    <Tab.Content>
                      <Tab.Pane eventKey="teleop">
                        <div className="p-2">
                          <h6 className="text-bright mb-3">3D Environment View</h6>
                          <div className="environment-wrapper environment-3d">
                            <ThreeDMap />
                          </div>
                        </div>
                      </Tab.Pane>
                      
                      <Tab.Pane eventKey="actions">
                        <div className="p-2">
                          <h6 className="text-bright mb-3">Robot Actions</h6>
                          <div className="d-grid gap-3">
                            <button className="control-button text-start w-100" style={{height: 'auto', padding: '1rem'}}>
                              <i className="bi bi-search me-2 fs-4"></i>
                              <span className="fs-5 text-bright">Start Scanning</span>
                            </button>
                            <button className="control-button text-start w-100" style={{height: 'auto', padding: '1rem'}}>
                              <i className="bi bi-house me-2 fs-4"></i>
                              <span className="fs-5 text-bright">Return Home</span>
                            </button>
                            <button className="control-button text-start w-100" style={{height: 'auto', padding: '1rem'}}>
                              <i className="bi bi-geo-alt me-2 fs-4"></i>
                              <span className="fs-5 text-bright">Set Waypoint</span>
                            </button>
                            <button className="control-button text-start w-100" style={{height: 'auto', padding: '1rem'}}>
                              <i className="bi bi-exclamation-triangle me-2 fs-4"></i>
                              <span className="fs-5 text-bright">Emergency Stop</span>
                              <span className="ms-2 badge bg-danger">E-STOP</span>
                            </button>
                          </div>
                        </div>
                      </Tab.Pane>
                      
                      <Tab.Pane eventKey="settings">
                        <div className="p-2">
                          <h6 className="text-bright mb-3">Robot Settings</h6>
                          <div className="mb-3">
                            <label className="form-label text-medium">Max Linear Speed (m/s)</label>
                            <input type="range" className="speed-slider" min="0.1" max="1.0" step="0.1" defaultValue="0.6" />
                            <div className="d-flex justify-content-between">
                              <span className="text-medium">0.1</span>
                              <span className="text-bright">0.6</span>
                              <span className="text-medium">1.0</span>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label className="form-label text-medium">Max Angular Speed (rad/s)</label>
                            <input type="range" className="speed-slider" min="0.1" max="1.0" step="0.1" defaultValue="0.5" />
                            <div className="d-flex justify-content-between">
                              <span className="text-medium">0.1</span>
                              <span className="text-bright">0.5</span>
                              <span className="text-medium">1.0</span>
                            </div>
                          </div>
                          
                          <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="autoReturn" />
                            <label className="form-check-label text-medium" htmlFor="autoReturn">Auto-return when battery low</label>
                          </div>
                          
                          <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="obstacleAvoidance" defaultChecked />
                            <label className="form-check-label text-medium" htmlFor="obstacleAvoidance">Obstacle avoidance</label>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Tab.Container>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="g-2">
            {/* Camera View */}
            <Col lg={6}>
              <Card className="mb-2">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-camera-video me-2"></i>Camera Feed</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="camera-wrapper">
                    <Camera />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Teleoperation with vertical speed slider */}
            <Col lg={6}>
              <Card className="mb-2 w-100">
                <Card.Header className="py-2">
                  <h5><i className="bi bi-arrows-move me-2"></i>Robot Control</h5>
                </Card.Header>
                <Card.Body className="p-2">
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
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Control;
