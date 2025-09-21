const pool = require('./db');

const setupSocket = (io) => {
    // Store active classrooms and their states
    const activeClassrooms = new Map();
    const userSockets = new Map();

    io.on('connection', (socket) => {
        console.log('New client connected');

        // Join classroom
        socket.on('joinRoom', async (user, callback) => {
            try {
                const { classroom, username, role } = user;
                
                // Check if classroom exists in database
                const result = await pool.query(
                    'SELECT * FROM classes WHERE name = $1',
                    [classroom]
                );

                if (result.rows.length === 0) {
                    callback({ success: false, message: 'Classroom not found' });
                    return;
                }

                // Initialize classroom if not exists
                if (!activeClassrooms.has(classroom)) {
                    activeClassrooms.set(classroom, {
                        teachers: new Set(),
                        students: new Set(),
                        isActive: false,
                        messages: [],
                        files: new Set() // Track active files in the classroom
                    });
                }

                const classroomData = activeClassrooms.get(classroom);

                // If student trying to join inactive class
                if (role === 'student' && !classroomData.isActive) {
                    callback({ success: false, message: 'Class has not started yet' });
                    return;
                }

                // Add user to appropriate set
                if (role === 'teacher') {
                    classroomData.teachers.add(username);
                } else {
                    classroomData.students.add(username);
                }

                // Store socket mapping
                userSockets.set(username, socket.id);
                
                // Join socket room
                socket.join(classroom);
                socket.username = username;
                socket.classroom = classroom;
                socket.role = role;

                // Notify room of new user
                const systemMessage = {
                    username: 'System',
                    message: `${username} has joined the class`,
                    system: true
                };
                classroomData.messages.push(systemMessage);
                
                io.to(classroom).emit('message', systemMessage);
                io.to(classroom).emit('updateClassroom', {
                    teachers: Array.from(classroomData.teachers),
                    students: Array.from(classroomData.students)
                });

                // Send success response with message history
                callback({
                    success: true,
                    history: classroomData.messages
                });

            } catch (error) {
                console.error('Error in joinRoom:', error);
                callback({ success: false, message: 'Server error' });
            }
        });

        // Handle chat messages
        socket.on('chatMessage', ({ user, message }) => {
            const classroom = socket.classroom;
            if (!classroom) return;

            const messageData = {
                username: user.username,
                message,
                timestamp: new Date()
            };

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                classroomData.messages.push(messageData);
                io.to(classroom).emit('message', messageData);
            }
        });

        // File upload notification
        socket.on('fileUploaded', (fileData) => {
            const classroom = socket.classroom;
            if (!classroom) return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                classroomData.files.add(fileData.id);
                const systemMessage = {
                    username: 'System',
                    message: `${socket.username} uploaded ${fileData.fileName}`,
                    system: true,
                    fileInfo: fileData
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);
                io.to(classroom).emit('newFile', fileData);
            }
        });

        // File download notification
        socket.on('fileDownloaded', (fileData) => {
            const classroom = socket.classroom;
            if (!classroom) return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                const systemMessage = {
                    username: 'System',
                    message: `${socket.username} downloaded ${fileData.fileName}`,
                    system: true,
                    fileInfo: fileData
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);
            }
        });

        // Assignment submission notification
        socket.on('assignmentSubmitted', (assignmentData) => {
            const classroom = socket.classroom;
            if (!classroom) return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                const systemMessage = {
                    username: 'System',
                    message: `${socket.username} submitted assignment: ${assignmentData.fileName}`,
                    system: true,
                    assignmentInfo: assignmentData
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);
                io.to(classroom).emit('newSubmission', assignmentData);
            }
        });

        // Start class (teachers only)
        socket.on('startClass', (classroom) => {
            if (socket.role !== 'teacher') return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                classroomData.isActive = true;
                const systemMessage = {
                    username: 'System',
                    message: 'Class has started',
                    system: true
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);
                io.to(classroom).emit('classStarted');
            }
        });

        // End class (teachers only)
        socket.on('endClass', (classroom) => {
            if (socket.role !== 'teacher') return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                classroomData.isActive = false;
                const systemMessage = {
                    username: 'System',
                    message: 'Class has ended',
                    system: true
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);

                // Notify all students to leave
                classroomData.students.forEach(student => {
                    const studentSocketId = userSockets.get(student);
                    if (studentSocketId) {
                        io.to(studentSocketId).emit('classEnded');
                    }
                });
            }
        });

        // Remove user (teachers only)
        socket.on('removeUser', ({ username, classroom }) => {
            if (socket.role !== 'teacher') return;

            const classroomData = activeClassrooms.get(classroom);
            if (classroomData) {
                classroomData.students.delete(username);
                classroomData.teachers.delete(username);

                const socketId = userSockets.get(username);
                if (socketId) {
                    io.to(socketId).emit('removed');
                    userSockets.delete(username);
                }

                io.to(classroom).emit('updateClassroom', {
                    teachers: Array.from(classroomData.teachers),
                    students: Array.from(classroomData.students)
                });

                const systemMessage = {
                    username: 'System',
                    message: `${username} has been removed from the class`,
                    system: true
                };
                classroomData.messages.push(systemMessage);
                io.to(classroom).emit('message', systemMessage);
            }
        });

        // Handle user leaving
        socket.on('leave', (user, callback) => {
            if (!socket.classroom) return;

            const classroomData = activeClassrooms.get(socket.classroom);
            if (classroomData) {
                if (socket.role === 'teacher') {
                    classroomData.teachers.delete(socket.username);
                } else {
                    classroomData.students.delete(socket.username);
                }

                userSockets.delete(socket.username);

                const systemMessage = {
                    username: 'System',
                    message: `${socket.username} has left the class`,
                    system: true
                };
                classroomData.messages.push(systemMessage);
                
                io.to(socket.classroom).emit('message', systemMessage);
                io.to(socket.classroom).emit('updateClassroom', {
                    teachers: Array.from(classroomData.teachers),
                    students: Array.from(classroomData.students)
                });

                socket.leave(socket.classroom);
                if (callback) callback();
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (!socket.classroom) return;

            const classroomData = activeClassrooms.get(socket.classroom);
            if (classroomData) {
                if (socket.role === 'teacher') {
                    classroomData.teachers.delete(socket.username);
                } else {
                    classroomData.students.delete(socket.username);
                }

                userSockets.delete(socket.username);

                const systemMessage = {
                    username: 'System',
                    message: `${socket.username} has disconnected`,
                    system: true
                };
                classroomData.messages.push(systemMessage);

                io.to(socket.classroom).emit('message', systemMessage);
                io.to(socket.classroom).emit('updateClassroom', {
                    teachers: Array.from(classroomData.teachers),
                    students: Array.from(classroomData.students)
                });
            }
        });
    });

    return io;
};

module.exports = setupSocket;
  