import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Blocks from "./Blocks";
import MyPlan from "./MyPlan";
import Request from "./Request";
import { AuthProvider } from "./AuthContext";
import LoggedInComponent from "./LoggedInComponent";
import TravelInfoInput from "./TravelInfoInput";
import ActivitySelection from './ActivitySelection';
import MapSelection from './MapSelection'; 
import Chat from './Chat'; 


function App() {
  return (
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blocks" element={<Blocks />} />
            <Route path="/my-plan" element={<MyPlan />} />
            <Route path="/request" element={<Request />} />
            <Route path="/travelers-input-selection" element={<TravelInfoInput />} />
            <Route path="/activity-selection" element={<ActivitySelection />} />
            <Route path="/map-selection" element={<MapSelection />} />  
            <Route path="/logged-in" element={<LoggedInComponent />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </Router>
      </AuthProvider>
  );
}

export default App;

