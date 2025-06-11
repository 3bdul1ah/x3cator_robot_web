import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { ImageViewer, Encoding, TransportLayer } from './ImageViewer';
import '../style/GasMap.css';

const BACKEND_URL = 'http://localhost:8080';

const GasMap = () => {
    const gasStreams = [
        {
            id: 'co',
            title: 'CO Gas Map',
            topic: '/gas_map/co',
            description: 'Carbon Monoxide Gas Distribution',
            icon: 'bi-cloud-fill',
            color: 'var(--danger)'
        },
        {
            id: 'o2',
            title: 'O2 Gas Map',
            topic: '/gas_map/o2',
            description: 'Oxygen Gas Distribution',
            icon: 'bi-cloud-fill',
            color: 'var(--success)'
        },
        {
            id: 'ch4',
            title: 'CH4 Gas Map',
            topic: '/gas_map/ch4',
            description: 'Methane Gas Distribution',
            icon: 'bi-cloud-fill',
            color: 'var(--info)'
        },
        {
            id: 'h2s',
            title: 'H2S Gas Map',
            topic: '/gas_map/h2s',
            description: 'Hydrogen Sulfide Gas Distribution',
            icon: 'bi-cloud-fill',
            color: 'var(--warning)'
        }
    ];

    return (
        <Container fluid className="dashboard-content">
            <div className="panel-title">
                <i className="bi bi-cloud"></i>
                <h4>Gas Distribution Maps</h4>
            </div>
            <Row className="g-2">
                {gasStreams.map((stream) => (
                    <Col key={stream.id} md={3}>
                        <Card className="gas-map-card">
                            <Card.Header>
                                <h5>
                                    <i className={`bi ${stream.icon}`} style={{ color: stream.color }}></i>
                                    {stream.title}
                                </h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="gas-map-view">
                                    <div className="camera-image-container">
                                        <ImageViewer
                                            topic={stream.topic}
                                            height={120}
                                            width={160}
                                            host="http://localhost"
                                            port={8080}
                                            encoding={Encoding.mjpeg}
                                            transportLayer={TransportLayer.raw}
                                            quality={95}
                                            containerHeight="100%"
                                            containerWidth="100%"
                                            imageStyle={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                backgroundColor: '#0a0a0c'
                                            }}
                                        />
                                    </div>
                                    <div className="gas-map-overlay">
                                        <span className="gas-map-description">
                                            {stream.description}
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default GasMap; 