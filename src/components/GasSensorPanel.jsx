import React, { useState, useEffect, useRef } from 'react';
import * as ROSLIB from 'roslib';
import { ros } from './RosConnection';
import Config from '../scripts/Config';
import '../style/gas-sensor.css';

const GasSensorPanel = ({ compact = false }) => {
  const [gasData, setGasData] = useState({
    CO: null,
    H2S: null,
    O2: null,
    CH4: null
  });
  
  const [hasReadings, setHasReadings] = useState(false);
  const topicRefs = useRef({});
  
  // Thresholds for gas readings (for status)
  const thresholds = {
    CO: { warning: 30, danger: 50 }, // ppm
    H2S: { warning: 5, danger: 10 },  // ppm
    O2: { warning: 19.5, danger: 18, dangerHigh: 23 }, // %
    CH4: { warning: 5, danger: 10 }   // %LEL
  };
  
  useEffect(() => {
    // ROS connection setup
    try {
      // Subscribe to individual gas sensor topics
      // CO topic
      topicRefs.current.co = new ROSLIB.Topic({
        ros: ros,
        name: Config.CO_TOPIC,
        messageType: Config.GAS_MSG_TYPE,
        throttle_rate: 1000
      });
      
      // H2S topic
      topicRefs.current.h2s = new ROSLIB.Topic({
        ros: ros,
        name: Config.H2S_TOPIC,
        messageType: Config.GAS_MSG_TYPE,
        throttle_rate: 1000
      });
      
      // O2 topic
      topicRefs.current.o2 = new ROSLIB.Topic({
        ros: ros,
        name: Config.O2_TOPIC,
        messageType: Config.GAS_MSG_TYPE,
        throttle_rate: 1000
      });
      
      // CH4 topic
      topicRefs.current.ch4 = new ROSLIB.Topic({
        ros: ros,
        name: Config.CH4_TOPIC,
        messageType: Config.GAS_MSG_TYPE,
        throttle_rate: 1000
      });
      
      // Set up subscription callbacks with timeout detection
      topicRefs.current.co.subscribe(message => {
        const value = message.data;
        setGasData(prev => ({ ...prev, CO: value }));
        setHasReadings(true);
      });
      
      topicRefs.current.h2s.subscribe(message => {
        const value = message.data;
        setGasData(prev => ({ ...prev, H2S: value }));
        setHasReadings(true);
      });
      
      topicRefs.current.o2.subscribe(message => {
        const value = message.data;
        setGasData(prev => ({ ...prev, O2: value }));
        setHasReadings(true);
      });
      
      topicRefs.current.ch4.subscribe(message => {
        const value = message.data;
        setGasData(prev => ({ ...prev, CH4: value }));
        setHasReadings(true);
      });
    } catch (error) {
      console.error("Error subscribing to gas sensor topics:", error);
    }
    
    return () => {
      // Unsubscribe from all topics
      if (topicRefs.current.co) topicRefs.current.co.unsubscribe();
      if (topicRefs.current.h2s) topicRefs.current.h2s.unsubscribe();
      if (topicRefs.current.o2) topicRefs.current.o2.unsubscribe();
      if (topicRefs.current.ch4) topicRefs.current.ch4.unsubscribe();
    };
  }, []);
  
  const getGasDisplayName = (gasCode) => {
    switch(gasCode) {
      case 'CO': return 'Carbon Monoxide';
      case 'H2S': return 'Hydrogen Sulfide';
      case 'O2': return 'Oxygen';
      case 'CH4': return 'Methane';
      default: return gasCode;
    }
  };
  
  const getGasUnit = (gasCode) => {
    switch(gasCode) {
      case 'CO': return 'ppm';
      case 'H2S': return 'ppm';
      case 'O2': return '%';
      case 'CH4': return '%LEL';
      default: return '';
    }
  };
  
  const getGasRange = (gasCode) => {
    switch(gasCode) {
      case 'CO': return '0-1000ppm (Res: 1ppm)';
      case 'H2S': return '0-100ppm (Res: 1ppm)';
      case 'O2': return '0-30%vol (Res: 0.1%vol)';
      case 'CH4': return '0-100%LEL (Res: 1%LEL)';
      default: return '';
    }
  };
  
  const getGasIcon = (gasCode) => {
    switch(gasCode) {
      case 'CO': return 'bi-cloud-haze';
      case 'H2S': return 'bi-droplet';
      case 'O2': return 'bi-wind';
      case 'CH4': return 'bi-fire';
      default: return 'bi-question-circle';
    }
  };
  
  const getGasStatus = (gasCode, value) => {
    if (value === null) return { level: 'no-reading', text: 'No Reading' };
    
    const threshold = thresholds[gasCode];
    
    if (gasCode === 'O2') {
      if (value < threshold.danger || value > threshold.dangerHigh) {
        return { level: 'danger', text: 'Unsafe' };
      } else if (value < threshold.warning) {
        return { level: 'warning', text: 'Low' };
      } else {
        return { level: 'normal', text: 'Normal' };
      }
    } else {
      if (value >= threshold.danger) {
        return { level: 'danger', text: 'Danger' };
      } else if (value >= threshold.warning) {
        return { level: 'warning', text: 'Warning' };
      } else {
        return { level: 'normal', text: 'Normal' };
      }
    }
  };
  
  // Utility to calculate percentage for the level indicators
  const calculateLevelPercentage = (gasCode, value) => {
    if (value === null) return 0;
    
    let percentage;
    
    switch(gasCode) {
      case 'CO': 
        // Assume max range is 100ppm for display purposes
        percentage = Math.min(Math.max(value / 100 * 100, 0), 100);
        break;
      case 'H2S': 
        // Assume max range is 20ppm for display purposes
        percentage = Math.min(Math.max(value / 20 * 100, 0), 100);
        break;
      case 'O2': 
        // For O2, ideal is around 20.9%. Range 15-25% -> 0-100%
        percentage = Math.min(Math.max((value - 15) / 10 * 100, 0), 100);
        break;
      case 'CH4': 
        // Assume max range is 20% LEL for display purposes
        percentage = Math.min(Math.max(value / 20 * 100, 0), 100);
        break;
      default:
        percentage = 0;
    }
    
    return percentage;
  };
  
  // Get color for the level indicator
  const getLevelColor = (gasCode, value) => {
    if (value === null) return 'var(--text-muted)';
    
    const status = getGasStatus(gasCode, value);
    
    switch(status.level) {
      case 'normal': return 'var(--success)';
      case 'warning': return 'var(--warning)';
      case 'danger': return 'var(--danger)';
      default: return 'var(--accent)';
    }
  };
  
  // Render no readings message for compact mode
  const renderNoReadingsCompact = () => (
    <div className="compact-gas-panel">
      <div className="no-readings-message compact">
        <i className="bi bi-exclamation-triangle"></i>
        <p>No gas readings available</p>
        <div className="no-readings-sub">Check ROS connection and gas sensor topics</div>
      </div>
    </div>
  );
  
  // Render no readings message for full mode
  const renderNoReadingsFull = () => (
    <div className="gas-sensor-container">
      <div className="gas-sensor-header">
        <h3 className="gas-sensor-title">
          <i className="bi bi-clipboard-data me-2"></i>
          Gas Sensor Readings
        </h3>
      </div>
      
      <div className="no-readings-message">
        <i className="bi bi-exclamation-triangle"></i>
        <h4>No Gas Readings Available</h4>
        <p>No data is being published to the gas sensor topics.</p>
        <div className="no-readings-details">
          <div className="no-readings-detail-item">
            <span className="detail-label">Topics:</span>
            <span className="detail-value">{Config.CO_TOPIC}, {Config.H2S_TOPIC}, {Config.O2_TOPIC}, {Config.CH4_TOPIC}</span>
          </div>
          <div className="no-readings-detail-item">
            <span className="detail-label">Message Type:</span>
            <span className="detail-value">{Config.GAS_MSG_TYPE}</span>
          </div>
        </div>
      </div>
      
      <div className="gas-info-container">
        <div className="gas-info-header">
          <h4 className="gas-info-title">
            <i className="bi bi-info-circle me-2"></i>
            Gas Sensor Information
          </h4>
        </div>
        <div className="gas-info-content">
          <div className="gas-info-item">
            <span className="gas-info-label">Sensor Type:</span>
            <span className="gas-info-value">ZCE04B Multi-Gas Sensor</span>
          </div>
          <div className="gas-info-item">
            <span className="gas-info-label">Update Rate:</span>
            <span className="gas-info-value">1 Hz (1 reading per second)</span>
          </div>
          
          <div className="gas-info-divider"></div>
          <div className="gas-info-item">
            <span className="gas-info-label">Status:</span>
            <span className="gas-info-value gas-info-inactive">Waiting for data</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // If no readings received yet, show the no readings message
  if (!hasReadings) {
    return compact ? renderNoReadingsCompact() : renderNoReadingsFull();
  }
  
  // Render compact mode
  if (compact) {
    // Create an array of gas types in the desired order for the 2x2 grid
    const orderedGasTypes = ['CO', 'H2S', 'O2', 'CH4'];
    
    return (
      <div className="compact-gas-panel">
        <div className="gas-sensor-grid compact">
          {orderedGasTypes.map(gas => {
            const status = getGasStatus(gas, gasData[gas]);
            const levelPercentage = calculateLevelPercentage(gas, gasData[gas]);
            const levelColor = getLevelColor(gas, gasData[gas]);
            
            return (
              <div key={gas} className="gas-item">
                <div className={`gas-icon ${gas.toLowerCase()}`}>
                  <i className={`bi ${getGasIcon(gas)}`}></i>
                </div>
                <div className="gas-info">
                  <div className="gas-name">{getGasDisplayName(gas)}</div>
                  <div className="gas-reading">
                    {gasData[gas] !== null ? (
                      <>
                        <span className="gas-value">{gasData[gas].toFixed(2)}</span>
                        <span className="gas-unit">{getGasUnit(gas)}</span>
                      </>
                    ) : (
                      <span className="gas-no-reading">No Reading</span>
                    )}
                  </div>
                  <div className="gas-level-bar">
                    <div 
                      className="gas-level-fill" 
                      style={{ 
                        width: `${levelPercentage}%`,
                        backgroundColor: levelColor
                      }}
                    ></div>
                  </div>
                </div>
                <div className={`gas-status-indicator ${status.level}`}>
                  {status.text}
                </div>
              </div>
            );
          })}
        </div>
        <div className="sensor-model">Gas Sensor Model: ZCE04B</div>
      </div>
    );
  }
  
  // Render full mode
  return (
    <div className="gas-sensor-container">
      <div className="gas-sensor-header">
        <h3 className="gas-sensor-title">
          <i className="bi bi-clipboard-data me-2"></i>
          Gas Sensor Readings
        </h3>
        <div className="realtime-badge">
          <i className="bi bi-broadcast me-1"></i>
          Real-Time
        </div>
      </div>
      
      <div className="gas-sensor-grid">
        {Object.keys(gasData).map(gas => {
          const status = getGasStatus(gas, gasData[gas]);
          const levelPercentage = calculateLevelPercentage(gas, gasData[gas]);
          const levelColor = getLevelColor(gas, gasData[gas]);
          
          return (
            <div key={gas} className="gas-reading">
              <div className="gas-reading-header">
                <div className={`gas-icon ${gas.toLowerCase()}-icon`}>
                  <i className={`bi ${getGasIcon(gas)}`}></i>
                </div>
                <div>
                  <h4 className="gas-name">{getGasDisplayName(gas)}</h4>
                </div>
              </div>
              {gasData[gas] !== null ? (
                <div className="gas-value">
                  {gasData[gas].toFixed(2)} <span className="gas-unit">{getGasUnit(gas)}</span>
                </div>
              ) : (
                <div className="gas-no-reading-full">No Reading</div>
              )}
              <div className="gas-level-container">
                <div className="gas-level-bar">
                  <div 
                    className="gas-level-fill" 
                    style={{ 
                      width: `${levelPercentage}%`,
                      backgroundColor: levelColor
                    }}
                  ></div>
                </div>
                <div className="gas-range-labels">
                  <span>0</span>
                  <span>{getGasUnit(gas)}</span>
                </div>
              </div>
              <div className="gas-range">{getGasRange(gas)}</div>
              <div className={`gas-status ${status.level}`}>
                {status.text}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="gas-info-container">
        <div className="gas-info-header">
          <h4 className="gas-info-title">
            <i className="bi bi-info-circle me-2"></i>
            Gas Sensor Information
          </h4>
        </div>
        <div className="gas-info-content">
          <div className="gas-info-item">
            <span className="gas-info-label">Sensor Type:</span>
            <span className="gas-info-value">ZCE04B Multi-Gas Sensor</span>
          </div>
          <div className="gas-info-item">
            <span className="gas-info-label">Update Rate:</span>
            <span className="gas-info-value">1 Hz (1 reading per second)</span>
          </div>
          
          <div className="gas-info-divider"></div>
          <div className="gas-info-item">
            <span className="gas-info-label">Status:</span>
            <span className="gas-info-value gas-info-active">Active & Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasSensorPanel;