const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only images, videos, PDFs, and documents are allowed.'));
    }
}).single('file');

exports.uploadFile = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const { classId, category, isAssignment, dueDate } = req.body;

            const query = `
                INSERT INTO files (filename, original_name, mime_type, size, url, uploaded_by, class_id, category, is_assignment, due_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                `/uploads/${req.file.filename}`,
                req.user.id,
                classId,
                category,
                isAssignment || false,
                dueDate
            ];

            const result = await pool.query(query, values);
            const file = result.rows[0];

            // Emit socket event for real-time updates
            req.app.get('io').emit('newFile', {
                fileId: file.id,
                filename: file.original_name,
                url: file.url,
                uploadedBy: req.user.id,
                classId: file.class_id
            });

            res.status(201).json(file);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
};

exports.downloadFile = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
        const file = result.rows[0];

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Log file access
        await pool.query(
            'INSERT INTO file_access (file_id, user_id) VALUES ($1, $2)',
            [file.id, req.user.id]
        );

        const filePath = path.join(__dirname, '..', 'uploads', file.filename);
        res.download(filePath, file.original_name);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading file', error: error.message });
    }
};

exports.getClassFiles = async (req, res) => {
    try {
        const { classId } = req.params;
        const query = `
            SELECT f.*, u.name as uploader_name,
                   COUNT(DISTINCT fa.id) as view_count,
                   COUNT(DISTINCT fb.id) as bookmark_count,
                   EXISTS(SELECT 1 FROM file_bookmarks fb2 WHERE fb2.file_id = f.id AND fb2.user_id = $2) as is_bookmarked
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            LEFT JOIN file_access fa ON f.id = fa.file_id
            LEFT JOIN file_bookmarks fb ON f.id = fb.file_id
            WHERE f.class_id = $1
            GROUP BY f.id, u.name
            ORDER BY f.created_at DESC
        `;
        
        const result = await pool.query(query, [classId, req.user.id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
};

exports.toggleBookmark = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const checkQuery = 'SELECT id FROM file_bookmarks WHERE file_id = $1 AND user_id = $2';
        const checkResult = await pool.query(checkQuery, [fileId, userId]);

        if (checkResult.rows.length > 0) {
            await pool.query('DELETE FROM file_bookmarks WHERE file_id = $1 AND user_id = $2', [fileId, userId]);
            res.json({ bookmarked: false });
        } else {
            await pool.query('INSERT INTO file_bookmarks (file_id, user_id) VALUES ($1, $2)', [fileId, userId]);
            res.json({ bookmarked: true });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling bookmark', error: error.message });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }

            const { assignmentId } = req.params;

            // First save the submission file
            const fileQuery = `
                INSERT INTO files (filename, original_name, mime_type, size, url, uploaded_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `;

            const fileValues = [
                req.file.filename,
                req.file.originalname,
                req.file.mimetype,
                req.file.size,
                `/uploads/${req.file.filename}`,
                req.user.id
            ];

            const fileResult = await pool.query(fileQuery, fileValues);
            const submissionFileId = fileResult.rows[0].id;

            // Then create the submission record
            const submissionQuery = `
                INSERT INTO file_submissions (assignment_id, student_id, submission_file_id)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            const submissionResult = await pool.query(submissionQuery, [
                assignmentId,
                req.user.id,
                submissionFileId
            ]);

            res.status(201).json(submissionResult.rows[0]);
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting assignment', error: error.message });
    }
}; 