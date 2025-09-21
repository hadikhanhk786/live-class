import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Login from "./components/Login";
import StudentView from "./components/StudentView";
import TeacherView from "./components/TeacherView";
import ManagerView from "./components/ManagerView";

const socket = io("http://localhost:5001", {
    transports: ["websocket"],
});

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/student" element={<StudentView user={user} setUser={setUser} socket={socket} />} />
        <Route path="/teacher" element={<TeacherView user={user} setUser={setUser} socket={socket} />} />
        <Route path="/manager" element={<ManagerView user={user} setUser={setUser} socket={socket} />} />
      </Routes>
    </Router>
  );
}

export default App;