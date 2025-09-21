import React from 'react';

const FileViewer = ({ file }) => {
    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');
    const isPDF = file.mimeType === 'application/pdf';

    const handleDownload = async () => {
        try {
            window.open(`http://localhost:5000/api/files/download/${file._id}`, '_blank');
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading file');
        }
    };

    const renderFilePreview = () => {
        if (isImage) {
            return (
                <img
                    src={`http://localhost:5000${file.url}`}
                    alt={file.originalName}
                    className="max-w-full h-auto rounded-lg"
                />
            );
        } else if (isVideo) {
            return (
                <video
                    controls
                    className="max-w-full h-auto rounded-lg"
                >
                    <source src={`http://localhost:5000${file.url}`} type={file.mimeType} />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (isPDF) {
            return (
                <iframe
                    src={`http://localhost:5000${file.url}`}
                    title={file.originalName}
                    className="w-full h-96 rounded-lg"
                />
            );
        } else {
            return (
                <div className="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
                    <i className="fas fa-file text-4xl text-gray-400 mr-2"></i>
                    <span>{file.originalName}</span>
                </div>
            );
        }
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <div className="mb-2 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{file.originalName}</h3>
                <button
                    onClick={handleDownload}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Download
                </button>
            </div>
            <div className="mt-4">
                {renderFilePreview()}
            </div>
            <div className="mt-2 text-sm text-gray-500">
                <p>Uploaded by: {file.uploadedBy?.name || 'Unknown'}</p>
                <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>Uploaded: {new Date(file.uploadedAt).toLocaleString()}</p>
            </div>
        </div>
    );
};

export default FileViewer; 