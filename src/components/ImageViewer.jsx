import React from "react";
import PropTypes from "prop-types";

// Encoding options as constants
const Encoding = {
    mjpeg: "mjpeg",
    ros_compressed: "ros_compressed",
    png: "png",
    vp8: "vp8",
    h264: "h264",
};

// Transport layer options as constants
const TransportLayer = {
    raw: "raw",
    compressed: "compressed",
    theora: "theora",
};

function rosImageSrcString(
    topic, 
    height = 480, 
    width = 640, 
    host = "http://localhost", 
    port = 8080, 
    encoding = Encoding.mjpeg, 
    transportLayer = TransportLayer.raw, 
    quality = 95, 
    bitrate = 100000, 
    qmin = 10, 
    qmax = 42, 
    gop = 250, 
    vp8Quality = 'realtime',
    transport = null
) {
    // Handle the case where a transport parameter is passed
    const type = transport || encoding;
    
    if (type === Encoding.mjpeg || type === "mjpeg") {
        return getMjpegSourceString(topic, height, width, host, port, type, transportLayer, quality);
    } else if (type === Encoding.vp8) {
        return getVp8SourceString(topic, height, width, host, port, type, transportLayer, bitrate, qmin, qmax, gop, vp8Quality);
    } else {
        return getOtherSourceString(topic, height, width, host, port, type, transportLayer);
    }
}

function getMjpegSourceString(
    topic, 
    height = 480, 
    width = 640, 
    host = "http://localhost", 
    port = 8080, 
    encoding = Encoding.mjpeg, 
    transportLayer = TransportLayer.raw, 
    quality = 95
) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}&quality=${quality}`;
}

function getVp8SourceString(
    topic, 
    height, 
    width, 
    host, 
    port, 
    encoding, 
    transportLayer, 
    bitrate, 
    qmin, 
    qmax, 
    gop, 
    vp8Quality
) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}&bitrate=${bitrate}&qmin=${qmin}&qmax=${qmax}&gop=${gop}&quality=${vp8Quality}`;
}

function getOtherSourceString(
    topic, 
    height, 
    width, 
    host, 
    port, 
    encoding, 
    transportLayer
) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}`;
}

const defaultImageStyle = {
    maxWidth: "100%",
    height: "auto",
};

const ImageViewer = (props) => {
    const {
        topic,
        height = 480,
        width = 640,
        containerHeight,
        containerWidth,
        host = "http://localhost",
        port = 8080,
        transport = "mjpeg",
        transportLayer = "raw",
        quality = 95,
        disabled = false
    } = props;

    const style = props.imageStyle || 
        ((containerWidth && containerHeight) ? {} : {
            maxWidth: "100%",
            height: "auto",
        });
    
    if (disabled) {
        return (<img src="" alt="" style={style}/>);
    } else {
        // Use the direct URL format for the web video server
        const src = `${host}:${port}/stream?topic=${topic}&type=${transport}&default_transport=${transportLayer}&width=${width}&height=${height}&quality=${quality}`;
        
        return (
            <img 
                src={src} 
                width={containerWidth || width} 
                height={containerHeight || height} 
                alt="" 
                style={style}
            />
        );
    }
};

ImageViewer.propTypes = {
    topic: PropTypes.string.isRequired,
    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    containerWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    containerHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    host: PropTypes.string,
    port: PropTypes.number,
    transport: PropTypes.string,
    transportLayer: PropTypes.string,
    quality: PropTypes.number,
    disabled: PropTypes.bool,
    imageStyle: PropTypes.object,
};

export { ImageViewer, Encoding, TransportLayer };
export default ImageViewer;

