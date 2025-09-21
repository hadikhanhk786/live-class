import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentView.css";
import FileUpload from './FileUpload';
import FileViewer from './FileViewer';
import axios from 'axios';

function StudentView({ user, setUser, socket, classId }) {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [classroom, setClassroom] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", user, (response) => {
      if (!response.success) {
        alert("Class has not started yet.");
        navigate("/");
        return;
      }
      setClassroom(user.classroom);
      setMessages(response.history);
    });

    socket.on("updateClassroom", (classroom) => {
      console.log(classroom.students)
      setStudents(classroom.students);
      setTeachers(classroom.teachers);
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leave", user);
    };
  }, [socket, user, navigate]);

  useEffect(() => {
    if (!user) return;
    socket.on("removed", () => {
      alert("You have been removed from the class.");
      navigate("/");
    });

    return () => {
      socket.emit("leave", user);
    };
  }, [socket, user]);

  useEffect(() => {
    fetchFiles();
  }, [classId]);

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

  const handleSubmitAssignment = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(
        `http://localhost:5000/api/files/submit-assignment/${selectedAssignment.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setShowSubmissionModal(false);
      fetchFiles();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Error submitting assignment');
    }
  };

  const toggleBookmark = async (fileId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/files/toggle-bookmark/${fileId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      fetchFiles();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    const matchesBookmark = !bookmarkedOnly || file.is_bookmarked;
    return matchesSearch && matchesCategory && matchesBookmark;
  });

  const categories = ['all', 'lectures', 'assignments', 'materials', 'other'];

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { user, message });
      setMessage("");
    }
  };

  const handleLeave = () => {
    socket.emit("leave", user, () => {
      setUser(null);
      navigate("/");
    });
  };

  return (
    <div className="chat-container">
      <nav className="top-nav">
        <h2 className="class-name">📚 Class: {classroom || "Waiting for class to start..."}</h2>
        <button className="leave-button" onClick={handleLeave}>🚪 Leave</button>
      </nav>
      <div className="main-content">
      <aside className="sidebar">
  <h3>👨‍🏫 Teachers</h3>
  <ul>
    {[...new Set(teachers)].map((t, i) => (
      <li key={i}>
        🎓 {t} 
        {/* Only show remove button if current user is a teacher */}
        {user.role === "teacher" && t !== user.username && (
          <button className="remove-btn" onClick={() => removeUser(t)}>❌</button>
        )}
      </li>
    ))}
  </ul>

  <h3>👥 Students</h3>
  <ul>
    {[...new Set(students)].map((s, i) => (
      <li key={i}>
        🎓 {s} 
        {user.role === "teacher" && (
          <button className="remove-btn" onClick={() => removeUser(s)}>❌</button>
        )}
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
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bookmarkedOnly}
                onChange={(e) => setBookmarkedOnly(e.target.checked)}
                className="mr-2"
              />
              Show Bookmarked Only
            </label>
          </div>
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

        {showSubmissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Submit Assignment</h3>
              <p className="mb-4">
                Assignment: {selectedAssignment?.original_name}
                {selectedAssignment?.due_date && (
                  <span className="block text-sm text-gray-500">
                    Due: {new Date(selectedAssignment.due_date).toLocaleString()}
                  </span>
                )}
              </p>

              <FileUpload onFileUpload={handleSubmitAssignment} />

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowSubmissionModal(false)}
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
            <div key={file.id} className="relative">
              <button
                onClick={() => toggleBookmark(file.id)}
                className={`absolute top-2 right-2 z-10 p-2 rounded-full ${
                  file.is_bookmarked ? 'text-yellow-500' : 'text-gray-400'
                }`}
              >
                <i className="fas fa-bookmark"></i>
              </button>
              <FileViewer
                file={file}
                isStudent={true}
                onSubmit={() => {
                  setSelectedAssignment(file);
                  setShowSubmissionModal(true);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StudentView;
