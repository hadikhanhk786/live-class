import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [classroom, setClassroom] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (username.trim() && classroom.trim()) {
      setUser({ username, classroom, role });
      navigate(
        role === "teacher" ? "/teacher" :
        role === "manager" ? "/manager" :
        "/student"
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>📚 Join Classroom</h2>
        <input
          type="text"
          placeholder="👤 Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="🏫 Enter Classroom Name"
          value={classroom}
          onChange={(e) => setClassroom(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">🎓 Student</option>
          <option value="teacher">👨‍🏫 Teacher</option>
          <option value="manager">📊 Manager</option>
        </select>
        <button onClick={handleJoin}>🚀 Join</button>
      </div>
    </div>
  );
}

export default Login;
