import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../images/a2tech_logo.png";

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row className="align-items-center py-2">
          <Col lg={3} md={4} className="d-flex align-items-center">
            <img src={logo} alt="X3Cator" className="footer-logo me-3" />
            <div className="social-links d-flex">
              <a href="https://www.facebook.com/a2tech.my" target="_blank" rel="noopener noreferrer" className="social-link">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="https://my.linkedin.com/company/a2tech-robotics" target="_blank" rel="noopener noreferrer" className="social-link">
                <i className="bi bi-linkedin"></i>
              </a>
              <a href="https://a2tech.my/" target="_blank" rel="noopener noreferrer" className="social-link">
                <i className="bi bi-globe"></i>
              </a>
            </div>
          </Col>
          
          <Col lg={5} md={4} className="text-center">
            <p className="mb-0">&copy; {new Date().getFullYear()} A2TECH Sdn. Bhd. All rights reserved.</p>
          </Col>
          
          <Col lg={4} md={4} className="text-end">
            <div className="d-flex justify-content-end align-items-center">
              <span className="me-3 text-muted"><i className="bi bi-geo-alt me-1"></i>V01, Faculty of Engineering Universiti Teknologi Malaysia</span>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
