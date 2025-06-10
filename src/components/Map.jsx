import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Button, ButtonGroup } from 'react-bootstrap';
import * as ROS2D from "ros2d";
import * as ROSLIB from "roslib";
import { ros } from "./RosConnection";
import robotImage from "../images/robot.png";
import RosConnectionLegacy from "./RosConnection";
import ThreeDMap from "./ThreeDMap";
import Config from "../scripts/Config";
import 'createjs-module'; // Import createjs module

// Make createjs available globally if it's not already
const createjs = window.createjs || {};

const Map = () => {
    const [mapAvailable, setMapAvailable] = useState(false);
    const [mapView, setMapView] = useState('2d'); // '2d' or '3d'
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showPath, setShowPath] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showWaypoints, setShowWaypoints] = useState(true);
    const mapRef = useRef(null);
    const viewerRef = useRef(null);
    const gridClientRef = useRef(null);
    const robotMarkerRef = useRef(null);
    const pathRef = useRef([]);

    useEffect(() => {
        if (!ros) return;

        console.log("Waiting for 2D map...");

        const mapTopic = new ROSLIB.Topic({
            ros: ros,
            name: Config.MAP_TOPIC,
            messageType: Config.MAP_MSG_TYPE,
        });

        const mapCallback = (message) => {
            if (message) {
                setMapAvailable(true);
                mapTopic.unsubscribe();
            }
        };

        mapTopic.subscribe(mapCallback);

        return () => {
            mapTopic.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!mapAvailable || !ros) return;

        console.log("Initializing 2D Map...");

        // Initialize the ROS2D viewer
        const viewer = new ROS2D.Viewer({
            divID: "map-container",
            width: 800,
            height: 600,
            background: '#1a1a1a'
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
                setZoomLevel(1);
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

        // Subscribe to odometry data for robot position
        const odomTopic = new ROSLIB.Topic({
            ros: ros,
            name: Config.ODOM_TOPIC,
            messageType: Config.ODOM_MSG_TYPE,
        });

        const odomCallback = (message) => {
            const { x, y } = message.pose.pose.position;
            const { z, w } = message.pose.pose.orientation;
            const theta = 2 * Math.atan2(z, w);

            // Update robot position
            robotMarker.x = x;
            robotMarker.y = -y;
            robotMarker.rotation = (theta * 180) / Math.PI - 90;

            // Update path if enabled
            if (showPath) {
                const newPathPoint = { x, y: -y };
                pathRef.current.push(newPathPoint);
                
                // Limit path length to prevent performance issues
                if (pathRef.current.length > 100) {
                    pathRef.current.shift();
                }
                
                // Draw path
                drawPath();
            }
        };
        
        odomTopic.subscribe(odomCallback);
        
        // Create mock waypoints for demonstration
        if (showWaypoints) {
            createMockWaypoints();
        }

        return () => {
            odomTopic.unsubscribe();
        };
    }, [mapAvailable, showPath, showWaypoints]);

    // Function to draw the robot's path
    const drawPath = () => {
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
    };
    
    // Create mock waypoints for demonstration
    const createMockWaypoints = () => {
        if (!viewerRef.current) return;
        
        // Remove existing waypoints
        if (viewerRef.current.scene.getChildByName("waypoints")) {
            viewerRef.current.scene.removeChild(viewerRef.current.scene.getChildByName("waypoints"));
        }
        
        // Create waypoints container
        const waypointsContainer = new createjs.Container();
        waypointsContainer.name = "waypoints";
        
        // Mock waypoints coordinates
        const waypointsCoordinates = [
            { x: 1.5, y: 1.2 },
            { x: 2.3, y: -0.8 },
            { x: 0.5, y: -1.5 },
            { x: -1.0, y: -0.5 },
        ];
        
        // Create waypoint markers
        waypointsCoordinates.forEach((coord, index) => {
            const waypoint = new createjs.Shape();
            waypoint.graphics.beginFill("rgba(33, 150, 243, 0.8)").drawCircle(0, 0, 0.15);
            waypoint.x = coord.x;
            waypoint.y = coord.y;
            
            // Add label
            const label = new createjs.Text(`WP${index + 1}`, "bold 0.2px Arial", "#fff");
            label.x = coord.x + 0.2;
            label.y = coord.y - 0.2;
            label.textBaseline = "alphabetic";
            
            waypointsContainer.addChild(waypoint);
            waypointsContainer.addChild(label);
        });
        
        // Add waypoints to scene
        if (viewerRef.current) {
            viewerRef.current.scene.addChild(waypointsContainer);
        }
    };
    
    // Handle zoom in/out
    const handleZoom = (direction) => {
        if (!viewerRef.current) return;
        
        const factor = direction === 'in' ? 1.2 : 0.8;
        viewerRef.current.zoom(factor);
        setZoomLevel(prevZoom => direction === 'in' ? prevZoom * 1.2 : prevZoom * 0.8);
    };
    
    // Reset zoom and position
    const handleResetView = () => {
        if (!viewerRef.current || !gridClientRef.current || !gridClientRef.current.currentGrid) return;
        
        viewerRef.current.scaleToDimensions(
            gridClientRef.current.currentGrid.width * 1.6,
            gridClientRef.current.currentGrid.height * 0.6
        );
        viewerRef.current.shift(
            gridClientRef.current.currentGrid.pose.position.x,
            gridClientRef.current.currentGrid.pose.position.y
        );
        setZoomLevel(1);
    };
    
    // Toggle path visibility
    const handleTogglePath = () => {
        const newPathState = !showPath;
        setShowPath(newPathState);
        
        if (!newPathState && viewerRef.current) {
            // Remove path if disabled
            if (viewerRef.current.scene.getChildByName("robotPath")) {
                viewerRef.current.scene.removeChild(viewerRef.current.scene.getChildByName("robotPath"));
            }
            // Clear path history
            pathRef.current = [];
        }
    };
    
    // Toggle waypoints visibility
    const handleToggleWaypoints = () => {
        const newWaypointsState = !showWaypoints;
        setShowWaypoints(newWaypointsState);
        
        if (viewerRef.current) {
            if (newWaypointsState) {
                createMockWaypoints();
            } else if (viewerRef.current.scene.getChildByName("waypoints")) {
                viewerRef.current.scene.removeChild(viewerRef.current.scene.getChildByName("waypoints"));
            }
        }
    };

    return (
        <div className="mapping-page">
            <Container className="py-4">
                <h2 className="mb-4">
                    <i className="bi bi-map me-2"></i>
                    Robot Mapping
                </h2>
                
                
                {/* Map View Options */}
                <Row className="mb-4">
                    <Col xs={12}>
                        <div className="d-flex justify-content-between align-items-center">
                            <ButtonGroup>
                                <Button 
                                    variant={mapView === '2d' ? 'danger' : 'outline-secondary'}
                                    onClick={() => setMapView('2d')}
                                >
                                    <i className="bi bi-map me-2"></i>2D Map
                                </Button>
                                <Button 
                                    variant={mapView === '3d' ? 'danger' : 'outline-secondary'}
                                    onClick={() => setMapView('3d')}
                                >
                                    <i className="bi bi-badge-3d me-2"></i>3D View
                                </Button>
                            </ButtonGroup>
                            
                            <div>
                                <span className="me-2">Zoom: {zoomLevel.toFixed(1)}x</span>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleZoom('in')}>
                                    <i className="bi bi-zoom-in"></i>
                                </Button>
                                <Button variant="outline-secondary" className="me-2" onClick={() => handleZoom('out')}>
                                    <i className="bi bi-zoom-out"></i>
                                </Button>
                                <Button variant="outline-secondary" onClick={handleResetView}>
                                    <i className="bi bi-arrows-fullscreen"></i>
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>
                
                <Row>
                    {/* Map Visualization */}
                    <Col lg={9}>
                        <Card className="data-card">
                            <Card.Body>
                                <h4 className="mb-3">
                                    {mapView === '2d' ? '2D Map Visualization' : '3D Environment View'}
                                </h4>
                                
                                {mapView === '2d' ? (
                                    <div className="position-relative">
                                        {mapAvailable ? (
                                            <div 
                                                id="map-container" 
                                                ref={mapRef} 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '600px', 
                                                    backgroundColor: '#1a1a1a',
                                                    borderRadius: 'var(--border-radius)',
                                                    overflow: 'hidden'
                                                }} 
                                            />
                                        ) : (
                                            <div className="ros-loader" style={{ height: '600px' }}>
                                                <div className="loader-rings">
                                                    <div></div>
                                                    <div></div>
                                                    <div></div>
                                                </div>
                                                <div className="loader-message">Waiting for map data...</div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ height: '600px' }}>
                                        <ThreeDMap />
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                    
                    {/* Map Controls with integrated Legend */}
                    <Col lg={3}>
                        <Card className="data-card">
                            <Card.Body className="p-0">
                                <div className="p-3">
                                    <h4 className="mb-3">Map Controls</h4>
                                    
                                    <h6 className="text-muted mb-2">Visibility</h6>
                                    <div className="d-grid gap-2 mb-3">
                                        <Button 
                                            variant={showPath ? 'danger' : 'outline-secondary'} 
                                            onClick={handleTogglePath}
                                            className="text-start"
                                            size="sm"
                                        >
                                            <i className={`bi ${showPath ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                                            Show Robot Path
                                        </Button>
                                        
                                        <Button 
                                            variant={showWaypoints ? 'danger' : 'outline-secondary'} 
                                            onClick={handleToggleWaypoints}
                                            className="text-start"
                                            size="sm"
                                        >
                                            <i className={`bi ${showWaypoints ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                                            Show Waypoints
                                        </Button>
                                        
                                        <Button 
                                            variant={showGrid ? 'danger' : 'outline-secondary'} 
                                            onClick={() => setShowGrid(!showGrid)}
                                            className="text-start"
                                            size="sm"
                                        >
                                            <i className={`bi ${showGrid ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                                            Show Grid
                                        </Button>
                                    </div>
                                    
                                    <h6 className="text-muted mb-2">Map Operations</h6>
                                    <div className="d-grid gap-2 mb-3">
                                        <Button variant="outline-secondary" className="text-start" size="sm">
                                            <i className="bi bi-download me-2"></i>
                                            Save Map
                                        </Button>
                                        
                                        <Button variant="outline-secondary" className="text-start" size="sm">
                                            <i className="bi bi-arrow-counterclockwise me-2"></i>
                                            Reset Map
                                        </Button>
                                        
                                        <Button variant="outline-secondary" className="text-start" size="sm">
                                            <i className="bi bi-grid-3x3 me-2"></i>
                                            Set Navigation Goal
                                        </Button>
                                        
                                        <Button variant="outline-secondary" className="text-start" size="sm">
                                            <i className="bi bi-plus-circle me-2"></i>
                                            Add Waypoint
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Map Legend as a sub-card */}
                                <div className="map-legend-card m-3 p-3 rounded mb-3">
                                    <h6 className="d-flex align-items-center mb-2">
                                        <i className="bi bi-card-list me-2"></i>
                                        Map Legend
                                    </h6>
                                    <div className="map-legend-items">
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#fff' }}></div>
                                            <span>Free Space</span>
                                        </div>
                                        
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#333' }}></div>
                                            <span>Unknown Area</span>
                                        </div>
                                        
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#000' }}></div>
                                            <span>Obstacles</span>
                                        </div>
                                        
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#e63946' }}></div>
                                            <span>Robot Path</span>
                                        </div>
                                        
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
                                            <span>Waypoints</span>
                                        </div>
                                        
                                        <div className="legend-item d-flex align-items-center">
                                            <img src={robotImage} alt="Robot" style={{ height: '16px', marginRight: '6px' }} />
                                            <span>Robot Position</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="m-3 mb-0">
                                    <div className="map-stats p-2 rounded mb-3">
                                        <h6 className="text-muted mb-2">Map Statistics</h6>
                                        <div className="d-flex justify-content-between mb-1">
                                            <small>Map Size:</small>
                                            <small>20m x 15m</small>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <small>Resolution:</small>
                                            <small>0.05 m/pixel</small>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <small>Updates:</small>
                                            <small>Real-time</small>
                                        </div>
                                    </div>
                                    
                                    <div className="map-tips p-2 rounded">
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-1"></i> Tip: Double-click on the map to set a navigation goal.
                                        </small>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Map;
