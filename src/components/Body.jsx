import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Map from "./Map";
import Camera from "./Camera";
import Control from "./Control";
import Monitor from "./Monitor";
import GasMap from "./GasMap";

const Body = () => {
  return (
    <main className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        {/* <Route path="/mapping" element={<Map />} /> */}
        <Route path="/camera" element={<Camera isStandalone={true} />} />
        <Route path="/control" element={<Control />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/gas-map" element={<GasMap />} />
      </Routes>
    </main>
  );
};

export default Body;
