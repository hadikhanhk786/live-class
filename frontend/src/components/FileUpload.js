import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onFileUpload }) => {
    const [uploading, setUploading] = useState(false);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://localhost:5000/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (onFileUpload) {
                onFileUpload(response.data);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'video/*': ['.mp4'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    return (
        <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
            <input {...getInputProps()} />
            {uploading ? (
                <p>Uploading...</p>
            ) : isDragActive ? (
                <p>Drop the file here...</p>
            ) : (
                <div>
                    <p>Drag & drop a file here, or click to select</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Supported files: Images, Videos, PDFs, and Documents
                    </p>
                </div>
            )}
        </div>
    );
};

export default FileUpload; 