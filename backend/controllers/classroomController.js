const {
  getClassroomHistory,
  saveChatMessage,
} = require("../models/classroomModel");

const classrooms = {}; // Store active classroom sessions

const joinRoom = async (
  io,
  socket,
  { username, classroom, role },
  callback
) => {
  socket.username = username;
  socket.classroom = classroom;
  socket.join(classroom);

  if (!classrooms[classroom]) {
    classrooms[classroom] = {
      students: [],
      teachers: [],
      started: false,
      history: [],
    };
    classrooms[classroom].history = await getClassroomHistory(classroom);
  }

  if (role === "student" && !classrooms[classroom].started) {
    return callback({ success: false, history: [] });
  }

  if (role === "student") classrooms[classroom].students.push(username);
  if (role === "teacher") classrooms[classroom].teachers.push(username);

  io.to(classroom).emit("updateClassroom", classrooms[classroom]); // ✅ Now `io` is passed correctly
  callback({ success: true, history: classrooms[classroom].history });
};

const startClass = async (io, classroom) => {
  if (classrooms[classroom]) {
    classrooms[classroom].started = true;
    const systemMessage = {
      username: "System",
      message: "Class has started",
      role: "system",
      event: "class_start",
    };
    classrooms[classroom].history.push(systemMessage);
    await saveChatMessage(
      classroom,
      "System",
      "Class has started",
      "system",
      "class_start"
    );
    io.to(classroom).emit("message", systemMessage);
  }
};

const endClass = async (io, classroom) => {
  if (classrooms[classroom]) {
    classrooms[classroom].started = false;
    const systemMessage = {
      username: "System",
      message: "Class has ended",
      role: "system",
      event: "class_end",
    };
    classrooms[classroom].history.push(systemMessage);
    await saveChatMessage(
      classroom,
      "System",
      "Class has ended",
      "system",
      "class_end"
    );
    io.to(classroom).emit("message", systemMessage);
  }
};

const chatMessage = async (io, { user, message }) => {
  const chatMessage = {
    username: user.username,
    message,
    role: user.role,
    event: "chat_message",
  };
  classrooms[user.classroom].history.push(chatMessage);
  await saveChatMessage(
    user.classroom,
    user.username,
    message,
    user.role,
    "chat_message"
  );
  io.to(user.classroom).emit("message", chatMessage);
};

const leaveClass = async (io, user, callback) => {
  if (!user) return;

  io.to(user.classroom).emit("message", {
    username: "System",
    message: `${user.username} has left the class`,
    role: "system",
    event: "user_leave",
  });
  await saveChatMessage(
    user.classroom,
    "System",
    `${user.username} has left the class`,
    "system",
    "user_leave"
  );

  if (callback) callback();
};

const removeUser = (io, { username, classroom }) => {
  if (classrooms[classroom]) {
    classrooms[classroom].students = classrooms[classroom].students.filter(
      (s) => s !== username
    );
    classrooms[classroom].teachers = classrooms[classroom].teachers.filter(
      (t) => t !== username
    );

    io.to(classroom).emit("updateClassroom", classrooms[classroom]); // ✅ Now `io` is passed correctly
    io.to(classroom).emit("message", {
      username: "System",
      message: `${username} has been removed`,
      role: "system",
      event: "user_removed",
    });

    const targetSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.username === username
    );
    if (targetSocket) io.to(targetSocket.id).emit("removed");
  }
};

module.exports = {
  joinRoom,
  startClass,
  endClass,
  chatMessage,
  leaveClass,
  removeUser,
};
