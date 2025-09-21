import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerView.css";

function ManagerView({ user, setUser, socket }) {
  const [classroomHistory, setClassroomHistory] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "manager") return;
    socket.emit("getClassroomHistory", {}, (history) => {
      console.log(history);
      setClassroomHistory(history);
    });
  }, [socket, user]);

  return (
    <div className="manager-container">
      <div className="manager-box">
        <h2>📊 Manager Dashboard</h2>
        <label>Select Classroom:</label>
        <select onChange={(e) => setSelectedClassroom(e.target.value)}>
          <option value="">All</option>
          {Array.from(new Set(classroomHistory.map((h) => h.classroom))).map((room, i) => (
            <option key={i} value={room}>{room}</option>
          ))}
        </select>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>🏫 Classroom</th>
                <th>👤 Username</th>
                <th>🎭 Role</th>
                <th>📌 Event</th>
                <th>⏳ Time</th>
              </tr>
            </thead>
            <tbody>
              {classroomHistory
                .filter((h) => !selectedClassroom || h.classroom === selectedClassroom)
                .map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.classroom}</td>
                    <td>{entry.username}</td>
                    <td>{entry.role}</td>
                    <td>{entry.event}</td>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <button className="logout-btn" onClick={() => {
          setUser(null);
          navigate("/");
        }}>🚪 Logout</button>
      </div>
    </div>
  );
}

export default ManagerView;
