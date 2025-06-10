import React, { useState, useEffect, useRef } from "react";
import * as ROSLIB from 'roslib';
import Config from "../scripts/Config";

const Teleoperation = ({ isCompact = false }) => {
    const [speed, setSpeed] = useState(0.6);
    const [activeKey, setActiveKey] = useState(null);
    const [connected, setConnected] = useState(false);
    const cmdVelRef = useRef(null);
    const rosRef = useRef(null);

    // Initialize ROS connection
    useEffect(() => {
        // Create ROS instance
        const ros = new ROSLIB.Ros({
            url: `ws://${Config.ROSBRIDGE_SERVER_IP}:${Config.ROSBRIDGE_SERVER_PORT}`
        });

        // Set up connection handlers
        ros.on('connection', () => {
            console.log('Connected to websocket server.');
            setConnected(true);
            
            // Create cmd_vel topic
            const cmdVel = new ROSLIB.Topic({
                ros: ros,
                name: Config.CMD_VEL_TOPIC,
                messageType: 'geometry_msgs/msg/Twist'
            });
            
            cmdVelRef.current = cmdVel;
        });

        ros.on('error', (error) => {
            console.log('Error connecting to websocket server:', error);
            setConnected(false);
        });

        ros.on('close', () => {
            console.log('Connection to websocket server closed.');
            setConnected(false);
        });

        rosRef.current = ros;

        // Clean up on component unmount
        return () => {
            if (rosRef.current) {
                rosRef.current.close();
            }
        };
    }, []);

    // Add keyboard event listeners
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return; // Prevent repeat triggers when key is held down
            
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'x'].includes(key)) {
                setActiveKey(key);
                
                // Set up new commands based on key
                let linearX = 0, angularZ = 0;
                
                switch (key) {
                    case 'w': // Forward
                        linearX = 1;
                        break;
                    case 's': // Stop
                        linearX = 0;
                        angularZ = 0;
                        break;
                    case 'a': // Left
                        angularZ = 1;
                        break;
                    case 'd': // Right
                        angularZ = -1;
                        break;
                    case 'x': // Backward
                        linearX = -1;
                        break;
                    default:
                        break;
                }
                
                // Send command
                sendCommand(linearX, angularZ);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', 'x'].includes(key) && key === activeKey) {
                setActiveKey(null);
                // Stop the robot
                sendCommand(0, 0);
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Clean up event listeners
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeKey, speed]);

    // Listen for speed change events from parent component
    useEffect(() => {
        const container = document.querySelector('.teleop-container');
        if (!container) return;

        const handleSpeedChange = (e) => {
            if (e.detail && typeof e.detail.speed === 'number') {
                setSpeed(e.detail.speed);
            }
        };

        container.addEventListener('speed-change', handleSpeedChange);

        return () => {
            container.removeEventListener('speed-change', handleSpeedChange);
        };
    }, []);

    const sendCommand = (linearX, angularZ) => {
        if (!cmdVelRef.current || !connected) return;
        
        const twist = {
            linear: { x: linearX * speed, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: angularZ * speed }
        };
        
        cmdVelRef.current.publish(twist);
    };

    const handleSpeedChange = (e) => {
        const newSpeed = parseFloat(e.target.value);
        setSpeed(newSpeed);
        
        // If a key is currently active, update the command with new speed
        if (activeKey) {
            const key = activeKey;
            let linearX = 0, angularZ = 0;
            
            switch (key) {
                case 'w': // Forward
                    linearX = 1;
                    break;
                case 's': // Stop
                    linearX = 0;
                    angularZ = 0;
                    break;
                case 'a': // Left
                    angularZ = 1;
                    break;
                case 'd': // Right
                    angularZ = -1;
                    break;
                case 'x': // Backward
                    linearX = -1;
                    break;
                default:
                    break;
            }
            
            sendCommand(linearX, angularZ);
        }
    };

    // For mouse/touch controls
    const startCommand = (linearX, angularZ) => {
        sendCommand(linearX, angularZ);
    };

    const stopCommand = () => {
        sendCommand(0, 0);
    };

    // Helper for button class based on active key
    const getButtonClass = (keyChar) => {
        return `control-button ${activeKey === keyChar ? 'active' : ''}`;
    };

    return (
        <div className="teleop-container">
            {!connected ? (
                <div className="ros-loader">
                    <div className="loader-rings">
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div className="loader-message">Waiting for robot connection...</div>
                </div>
            ) : (
                <>
                    <div className="keyboard-info">
                        Use keyboard: <span className="key">W</span> <span className="key">A</span> <span className="key">S</span> <span className="key">D</span> <span className="key">X</span> to control robot
                    </div>
                    
                    <div className="control-pad">
                        <div></div>
                        <button 
                            className={getButtonClass('w')}
                            onMouseDown={() => startCommand(1, 0)} 
                            onMouseUp={stopCommand}
                            onTouchStart={() => startCommand(1, 0)}
                            onTouchEnd={stopCommand}
                        >
                            <i className="bi bi-arrow-up"></i>
                            <span className="key-label">W</span>
                        </button>
                        <div></div>
                        
                        <button 
                            className={getButtonClass('a')}
                            onMouseDown={() => startCommand(0, 1)} 
                            onMouseUp={stopCommand}
                            onTouchStart={() => startCommand(0, 1)}
                            onTouchEnd={stopCommand}
                        >
                            <i className="bi bi-arrow-left"></i>
                            <span className="key-label">A</span>
                        </button>
                        
                        <button 
                            className={getButtonClass('s')}
                            onClick={stopCommand}
                            style={{ background: 'rgba(230, 57, 70, 0.8)' }}
                        >
                            <i className="bi bi-stop-fill"></i>
                            <span className="key-label">S</span>
                        </button>
                        
                        <button 
                            className={getButtonClass('d')}
                            onMouseDown={() => startCommand(0, -1)} 
                            onMouseUp={stopCommand}
                            onTouchStart={() => startCommand(0, -1)}
                            onTouchEnd={stopCommand}
                        >
                            <i className="bi bi-arrow-right"></i>
                            <span className="key-label">D</span>
                        </button>
                        
                        <div></div>
                        <button 
                            className={getButtonClass('x')}
                            onMouseDown={() => startCommand(-1, 0)} 
                            onMouseUp={stopCommand}
                            onTouchStart={() => startCommand(-1, 0)}
                            onTouchEnd={stopCommand}
                        >
                            <i className="bi bi-arrow-down"></i>
                            <span className="key-label">X</span>
                        </button>
                        <div></div>
                    </div>

                    {!isCompact && (
                        <div className="speed-control">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted">Min</span>
                                <span className="speed-display">{speed.toFixed(1)}</span>
                                <span className="text-muted">Max</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.1"
                                value={speed}
                                onChange={handleSpeedChange}
                                className="speed-slider"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Teleoperation;