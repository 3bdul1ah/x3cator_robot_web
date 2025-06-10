import React, { useState } from 'react';
import { Card, Container } from "react-bootstrap";

const CameraSimple = () => {
  // Using the exact URL provided by the user
  const specificUrl = "http://localhost:8080/stream_viewer?topic=/camera/d435/image_raw";
  
  return (
    <Container className="py-4">
      <h2 className="mb-4">Camera Viewer</h2>
      
      <Card>
        <Card.Body>
          <h4 className="mb-3">D435 Camera Feed</h4>
          <p>Using URL: {specificUrl}</p>
          
          <div className="camera-view" style={{ textAlign: 'center' }}>
            <iframe 
              src={specificUrl}
              title="D435 Camera Stream"
              width="100%"
              height="600"
              style={{ 
                border: '1px solid #ddd',
                maxWidth: '100%'
              }}
            />
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CameraSimple; 