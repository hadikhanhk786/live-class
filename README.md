# Live Classroom

A real-time virtual classroom application built with React.js, Node.js, Socket.IO, and PostgreSQL.

## Features

- **Real-time Communication**
  - Live chat between teachers and students
  - Real-time classroom updates
  - System notifications for user actions

- **Role-Based Access**
  - Student View
  - Teacher View 
  - Manager View

- **File Management**
  - File upload/download
  - Support for multiple file types (images, videos, PDFs, documents)
  - File categorization (lectures, assignments, materials)
  - File bookmarking system

- **Classroom Management**
  - Start/End class sessions
  - Student attendance tracking
  - Remove participants
  - View classroom history

## Tech Stack

- **Frontend**
  - React.js
  - Socket.IO Client
  - React Router
  - CSS for styling

- **Backend**
  - Node.js
  - Express.js
  - Socket.IO
  - PostgreSQL
  - Multer for file uploads

## Setup

1. **Database Setup**
```sh
psql -U hahikhan -d live_classroom -f backend/models/schema.sql
```

2. **Backend Setup**
```sh
cd backend
npm install
npm run dev
```

3. **Frontend Setup**
```sh
cd frontend
npm install
npm start
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=live_classroom
```

## API Routes

- `/api/files/upload` - Upload files
- `/api/files/download/:id` - Download files
- `/api/files/class/:classId` - Get class files
- `/api/classroom-history` - Get classroom history

## Socket Events

- `joinRoom` - Join classroom
- `chatMessage` - Send chat message
- `fileUploaded` - File upload notification
- `startClass` - Start class session
- `endClass` - End class session
- `leave` - Leave classroom

## Project Structure

```
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── socket.js
└── frontend/
    ├── public/
    └── src/
        ├── components/
        └── App.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
