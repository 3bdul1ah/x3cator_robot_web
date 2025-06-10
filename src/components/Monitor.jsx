import React from "react";
import { Container } from "react-bootstrap";
import GasSensorPanel from "./GasSensorPanel";

const Monitor = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <Container fluid className="px-2">
          <h3 className="text-bright mb-3">Environmental Monitoring</h3>
          <GasSensorPanel />
        </Container>
      </div>
    </div>
  );
};

export default Monitor;
