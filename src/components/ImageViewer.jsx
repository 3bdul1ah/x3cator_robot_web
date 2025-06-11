import React from "react";
import PropTypes from "prop-types";

export const Encoding = {
    mjpeg: "mjpeg",
    ros: "ros_compressed",
    png: "png",
    vp8: "vp8",
    h264: "h264",
};

export const TransportLayer = {
    raw: "raw",
    compressed: "compressed",
    theora: "theora",
};

const defaultImageStyle = {
    maxWidth: "100%",
    height: "auto",
};

function getMjpegSourceString(topic, height = 480, width = 640, host = "http://localhost", port = 8080, encoding = Encoding.mjpeg, transportLayer = TransportLayer.raw, quality = 95) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}&quality=${quality}`;
}

function getVp8SourceString(topic, height, width, host, port, encoding, transportLayer, bitrate, qmin, qmax, gop, vp8Quality) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}&bitrate=${bitrate}&qmin=${qmin}&qmax=${qmax}&gop=${gop}&quality=${vp8Quality}`;
}

function getOtherSourceString(topic, height, width, host, port, encoding, transportLayer) {
    return `${host}:${port}/stream?topic=${topic}&type=${encoding}&default_transport=${transportLayer}&width=${width}&height=${height}`;
}

export function rosImageSrcString(topic, height = 480, width = 640, host = "http://localhost", port = 8080, encoding = Encoding.mjpeg, transportLayer = TransportLayer.raw, quality = 95, bitrate = 100000, qmin = 10, qmax = 42, gop = 250, vp8Quality = 'realtime') {
    if (encoding === Encoding.mjpeg) {
        return getMjpegSourceString(topic, height, width, host, port, encoding, transportLayer, quality);
    } else if (encoding === Encoding.vp8) {
        return getVp8SourceString(topic, height, width, host, port, encoding, transportLayer, bitrate, qmin, qmax, gop, vp8Quality);
    } else {
        return getOtherSourceString(topic, height, width, host, port, encoding, transportLayer);
    }
}

export const ImageViewer = (props) => {
    const style = props.imageStyle || ((props.containerWidth && props.containerHeight) ? {} : defaultImageStyle);
    if (props.disabled) {
        return (<img src="" alt="" style={style}/>);
    } else {
        const src = rosImageSrcString(
            props.topic,
            props.height,
            props.width,
            props.host,
            props.port,
            props.encoding,
            props.transportLayer,
            props.quality,
            props.bitrate,
            props.qmin,
            props.qmax,
            props.gop,
            props.vp8Quality
        );
        return (<img src={src} width={props.containerWidth} height={props.containerHeight} alt="" style={style}/>);
    }
};

ImageViewer.propTypes = {
    topic: PropTypes.string.isRequired,
    height: PropTypes.number,
    width: PropTypes.number,
    containerWidth: PropTypes.number,
    containerHeight: PropTypes.number,
    host: PropTypes.string,
    port: PropTypes.number,
    encoding: PropTypes.string,
    transportLayer: PropTypes.string,
    quality: PropTypes.number,
    disabled: PropTypes.bool,
    bitrate: PropTypes.number,
    qmin: PropTypes.number,
    qmax: PropTypes.number,
    gop: PropTypes.number,
    vp8Quality: PropTypes.string,
    imageStyle: PropTypes.object,
};

