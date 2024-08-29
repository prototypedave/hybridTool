import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Dashboard from './Dashboard';
import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Security from './Security';
import Networks from './Network';
import Performance from './Performance';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/networks' element={<Networks />} />
        <Route path="/security" element={<Security />} />
        <Route path='/performance' element={<Performance />} />
      </Routes>
    </div>
  );
}

export default App;