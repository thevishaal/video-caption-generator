import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Upload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Trigger upload automatically when file is selected/dropped
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    
    // Basic validation
    if (!selectedFile.type.startsWith("video/")) {
      setMessage("Please select a valid video file.");
      return;
    }

    setFile(selectedFile);
    uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload) => {
    setLoading(true);
    setMessage("");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const token = localStorage.getItem("token");

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/videos/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      const videoId = res.data?.video_id || res.data?.data?.id || res.data?.id;

const videoUrl =
  res.data?.preview_url ||
  res.data?.data?.preview_url ||
  URL.createObjectURL(fileToUpload);

console.log("Upload Response:", res.data);

if (videoId) {
  setTimeout(() => {
    navigate(`/editor/upload/captions/${videoId}`, {
      state: {
        videoId,
        videoUrl,
      },
    });
  }, 800);
} else {
  setMessage("Upload worked, but backend didn't return video_id.");
  setLoading(false);
}
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Upload failed. Please try again.");
      setLoading(false);
      setFile(null);
    }
  };

  // Drag and Drop Handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!loading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearUpload = () => {
    if (!loading) {
      setFile(null);
      setProgress(0);
      setMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-[#Fafafa] flex justify-center py-20 px-6 font-sans">
      <div className="w-full max-w-[800px]">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 
            className="font-display text-4xl md:text-[2.75rem] font-bold text-[#1a1a1a] mb-4 tracking-tight"
          >
            Create Captions for Your Video
          </h1>
          <p className="text-[#4b5563] text-lg md:text-xl max-w-xl leading-relaxed">
            Transform your content with precision AI-generated captions. Support for 40+ languages with studio-grade accuracy.
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          disabled={loading}
        />

        {/* Drag & Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-[2rem] bg-white p-14 flex flex-col items-center justify-center transition-all duration-200
            ${isDragging ? "border-[#0d7677] bg-[#f0fdfa]" : "border-gray-200 hover:border-gray-300"}
            ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
          onClick={() => !loading && fileInputRef.current.click()}
        >
          <div className="w-[72px] h-[72px] bg-[#d1f4f9] rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-[#0d7677]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900">Drag and drop video</h3>
          <p className="text-sm text-gray-500 mt-2 mb-8">MP4, MOV or WEBM (Max 500MB)</p>
          
          <button 
            type="button"
            className="px-8 py-3.5 bg-[#0d7677] hover:bg-[#0a5c5d] text-white rounded-full font-semibold transition-colors shadow-sm"
          >
            Select File from Device
          </button>
        </div>

        {/* Error Message */}
        {message && !loading && (
          <p className="mt-4 text-red-500 font-medium text-center">{message}</p>
        )}

        {/* Upload Progress Bar (Visible only when file is selected) */}
        {file && (
          <div className="mt-6 bg-[#f4f5f7] rounded-2xl p-5 border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-4">
                {/* File Icon */}
                <svg className="w-6 h-6 text-[#0d7677] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate max-w-[250px] md:max-w-[400px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB • {progress}% {progress === 100 ? "COMPLETED" : "UPLOADED"}
                  </p>
                </div>
              </div>

              {/* Close/Cancel Button */}
              {!loading && (
                <button onClick={clearUpload} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Progress Track */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4 overflow-hidden">
              <div 
                className="bg-[#0d7677] h-1.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Upload;