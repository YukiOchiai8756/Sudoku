import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
import {AlertHandler} from "./components/Alert";

// Main Entry point for React
// This is the top-level that is rendered.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
            <App/>
    </React.StrictMode>
);
