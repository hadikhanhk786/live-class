import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherView.css";
import FileUpload from './FileUpload';
import FileViewer from './FileViewer';
import axios from 'axios';

function TeacherView({ user, setUser, socket, classId }) {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [classroom, setClassroom] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState('material'); // 'material' or 'assignment'
  const [dueDate, setDueDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", user, (response) => {
      setClassroom(user.classroom);
      setMessages(response.history);
    });

    socket.on("updateClassroom", (classroomData) => {
      setStudents(classroomData.students);
      setTeachers(classroomData.teachers);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("removed", () => {
      alert("You have been removed from the class.");
      navigate("/");
    });

    fetchFiles();

    return () => {
      socket.emit("leave", user);
    };
  }, [socket, user, navigate]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/files/class/${classId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('classId', classId);
      formData.append('category', selectedCategory);
      formData.append('isAssignment', uploadType === 'assignment');
      if (uploadType === 'assignment' && dueDate) {
        formData.append('dueDate', dueDate);
      }

      await axios.post('http://localhost:5000/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setIsUploadModalOpen(false);
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'lectures', 'assignments', 'materials', 'other'];

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { user, message });
      setMessage("");
    }
  };

  const removeUser = (username) => {
    socket.emit("removeUser", { username, classroom: user.classroom });
  };

  return (
    <div className="chat-container">
      <nav className="top-nav">
        <h2 className="class-name">📚 Class: {classroom || "Waiting for class to start..."}</h2>
        <button className="start-button" onClick={() => socket.emit("startClass", user.classroom)}>▶️ Start Class</button>
        <button className="end-button" onClick={() => socket.emit("endClass", user.classroom)}>⏹ End Class</button>
        <button className="leave-button" onClick={() => socket.emit("leave", user, () => navigate("/"))}>🚪 Leave</button>
      </nav>
      <div className="main-content">
        <aside className="sidebar">
          <h3>👨‍🏫 Teachers</h3>
          <ul>
            {[...new Set(teachers)].map((t, i) => (
              <li key={i}>
                🎓 {t} {t !== user.username && <button className="remove-btn" onClick={() => removeUser(t)}>❌</button>}
              </li>
            ))}
          </ul>
          <h3>👥 Students</h3>
          <ul>
            {[...new Set(students)].map((s, i) => (
              <li key={i}>
                🎓 {s} <button className="remove-btn" onClick={() => removeUser(s)}>❌</button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="chat-box">
          <ul className="messages">
            {messages.map((msg, i) => (
              <li key={i} className={msg.username === user.username ? "my-message" : msg.system ? "system-message" : "other-message"}>
                <strong>{msg.username}:</strong> {msg.message}
              </li>
            ))}
          </ul>
          <div className="message-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message... 💬"
            />
            <button onClick={sendMessage}>📩 Send</button>
          </div>
        </section>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Class Materials</h2>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload New Material
          </button>
        </div>

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-4 py-2 w-64"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded px-4 py-2"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Upload New Material</h3>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="border rounded px-4 py-2 w-full mb-4"
              >
                <option value="material">Study Material</option>
                <option value="assignment">Assignment</option>
              </select>

              {uploadType === 'assignment' && (
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="border rounded px-4 py-2 w-full mb-4"
                />
              )}

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border rounded px-4 py-2 w-full mb-4"
              >
                {categories.filter(cat => cat !== 'all').map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              <FileUpload onFileUpload={handleFileUpload} />

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="bg-gray-300 text-black px-4 py-2 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <FileViewer
              key={file.id}
              file={file}
              onDelete={fetchFiles}
              showSubmissions={file.is_assignment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherView;
