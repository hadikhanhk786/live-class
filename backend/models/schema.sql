-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create class_enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    student_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    url VARCHAR(255) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    class_id INTEGER REFERENCES classes(id),
    category VARCHAR(50),
    is_assignment BOOLEAN DEFAULT false,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file_access table for tracking file views
CREATE TABLE IF NOT EXISTS file_access (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file_submissions table for assignments
CREATE TABLE IF NOT EXISTS file_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES files(id),
    student_id INTEGER REFERENCES users(id),
    submission_file_id INTEGER REFERENCES files(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade DECIMAL(5,2),
    feedback TEXT
);

-- Create file_comments table
CREATE TABLE IF NOT EXISTS file_comments (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file_bookmarks table
CREATE TABLE IF NOT EXISTS file_bookmarks (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, user_id)
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Create file_tags table
CREATE TABLE IF NOT EXISTS file_tags (
    file_id INTEGER REFERENCES files(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (file_id, tag_id)
); 