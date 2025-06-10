import React from 'react';
import ReactDOM from 'react-dom/client';

import './style/index.css';
// import './style/lux-bootstrap.min.css'
// import './style/sketchy-bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style/main.css';
import './style/ros-components.css';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


reportWebVitals();
  