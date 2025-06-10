import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import robot from "../images/robot.png";
import a2techLogo from "../images/a2tech_logo.png";
import "../style/Header.css";
import { ros } from "./RosConnection";
import * as ROSLIB from 'roslib';
import Config from "../scripts/Config";

const Header = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(false);
  const [cmdVel, setCmdVel] = useState(null);
  
  useEffect(() => {
    if (!ros) return;

    const handleConnection = () => {
      setConnected(true);
      
      // Set up cmd_vel topic for emergency stop
      const topic = new ROSLIB.Topic({
        ros: ros,
        name: Config.CMD_VEL_TOPIC,
        messageType: "geometry_msgs/msg/Twist",
      });
      setCmdVel(topic);
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
      
      // Set up cmd_vel topic for emergency stop
      const topic = new ROSLIB.Topic({
        ros: ros,
        name: Config.CMD_VEL_TOPIC,
        messageType: "geometry_msgs/msg/Twist",
      });
      setCmdVel(topic);
    }

    return () => {
      ros.off('connection', handleConnection);
      ros.off('error', handleDisconnection);
      ros.off('close', handleDisconnection);
    };
  }, []);

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

  return (
    <header>
      <div className="dashboard-navbar">
        <div className="navbar-brand" style={{ marginRight: '30px' }}>
          <div className="brand-icon">
            <img src={robot} alt="X3CATOR-R" className="navbar-robot-img" style={{ filter: 'none' }} />
            <div className="pulse-ring"></div>
          </div>
          <div className="brand-text">
            <div className="title-line">
              <span className="x3-logo" style={{ fontSize: '28px' }}>X3CATOR-</span><span className="accent" style={{ fontSize: '28px', color: '#e63946' }}>R</span>
            </div>
            <span className="subtitle">Advanced Firefighting Robot</span>
          </div>
        </div>

        <div className="navbar-center">
          <img src={a2techLogo} alt="A2TECH" className="a2tech-logo" />
        </div>
        
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === "/" ? 'active' : ''}`}>
            <i className="bi bi-house"></i> Home
          </Link>
          <Link to="/control" className={`nav-link ${location.pathname === "/control" ? 'active' : ''}`}>
            <i className="bi bi-joystick"></i> Control
          </Link>
          {/* <Link to="/mapping" className={`nav-link ${location.pathname === "/mapping" ? 'active' : ''}`}>
            <i className="bi bi-map"></i> Mapping
          </Link> */}
          <Link to="/monitor" className={`nav-link ${location.pathname === "/monitor" ? 'active' : ''}`}>
            <i className="bi bi-graph-up"></i> Monitor
          </Link>
          <div className={`connection-pill ${connected ? 'connected' : 'disconnected'}`}>
            <i className={`bi ${connected ? 'bi-wifi' : 'bi-wifi-off'} status-icon ${connected ? 'connected' : 'disconnected'}`}></i>
            <span>{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
