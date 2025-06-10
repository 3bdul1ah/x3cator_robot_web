// src/Camera.js
import React, { useState, useCallback } from 'react';
import '../style/Camera.css';

const BACKEND_URL = 'http://localhost:8111';

const Camera = () => {
    const [panSpeed, setPanSpeed] = useState(0.6);
    const [activeKey, setActiveKey] = useState(null);

    const sendPTZCommand = useCallback(async (command, isStop = false) => {
        try {
            const formData = new URLSearchParams();
            formData.append('command', command);

            if (isStop) {
                formData.append('panSpeed', '0');
                formData.append('tiltSpeed', '0');
                formData.append('focusSpeed', '0');
                formData.append('zoomSpeed', '0');
            } else {
                formData.append('panSpeed', String(Math.round(panSpeed * 6)));
                formData.append('tiltSpeed', String(Math.round(panSpeed * 6)));
                formData.append('focusSpeed', String(Math.round(panSpeed * 2)));
                formData.append('zoomSpeed', String(Math.round(panSpeed * 2)));
            }

            await fetch(`${BACKEND_URL}/ptz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString()
            });
        } catch (error) {
            console.error('PTZ Error:', error);
        }
    }, [panSpeed]);

    const startCommand = (command) => {
        sendPTZCommand(command);
    };

    const stopCommand = () => {
        sendPTZCommand('0', true);
    };

    const getButtonClass = (keyChar) => {
        return `control-button ${activeKey === keyChar ? 'active' : ''}`;
    };

    return (
        <div className="camera-view">
            <div className="camera-image-container">
                <img 
                    src={`${BACKEND_URL}/stream`} 
                    alt="Camera Stream"
                    className="camera-image"
                />
                <div className="embedded-controls">
                    <div className="control-pad">
                        <button 
                            className={getButtonClass('t')}
                            onMouseDown={() => startCommand('6')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-up-left"></i>
                        </button>
                        <button 
                            className={getButtonClass('y')}
                            onMouseDown={() => startCommand('1')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-up"></i>
                        </button>
                        <button 
                            className={getButtonClass('u')}
                            onMouseDown={() => startCommand('7')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-up-right"></i>
                        </button>

                        <button 
                            className={getButtonClass('g')}
                            onMouseDown={() => startCommand('3')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-left"></i>
                        </button>
                        <button 
                            className={getButtonClass('h')}
                            onClick={stopCommand}
                        >
                            <i className="bi bi-stop-fill"></i>
                        </button>
                        <button 
                            className={getButtonClass('j')}
                            onMouseDown={() => startCommand('4')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-right"></i>
                        </button>

                        <button 
                            className={getButtonClass('b')}
                            onMouseDown={() => startCommand('5')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-down-left"></i>
                        </button>
                        <button 
                            className={getButtonClass('n')}
                            onMouseDown={() => startCommand('2')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-down"></i>
                        </button>
                        <button 
                            className={getButtonClass('m')}
                            onMouseDown={() => startCommand('8')} 
                            onMouseUp={stopCommand}
                        >
                            <i className="bi bi-arrow-down-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Camera;