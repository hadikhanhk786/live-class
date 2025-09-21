const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth'); // Assuming you have authentication middleware

// File routes
router.post('/upload', auth, fileController.uploadFile);
router.get('/download/:id', auth, fileController.downloadFile);
router.get('/list', auth, fileController.getFiles);

module.exports = router; 