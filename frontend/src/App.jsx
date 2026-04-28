import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import PublicRoute from "./Components/common/PublicRoute";
import ProtectedRoute from "./Components/common/ProtectedRoute";

import Landing from "./pages/Landing/Landing";
import LoginPage from "./pages/Authentication/LoginPage";
import Register from "./pages/Authentication/Register";
import ForgotPassword from "./pages/Authentication/ForgotPassword";
import ResetPassword from "./pages/Authentication/ResetPassword";
import SendEmail from "./pages/Authentication/SendEmail";
import VerifyEmail from "./pages/Authentication/VerifyEmail";
import VerifyPassword from "./pages/Authentication/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import UserProfile from "./pages/Authentication/UserProfile";
import ChangePassword from "./pages/Authentication/ChangePassword";
import MyProfile from "./pages/Authentication/MyProfile";
import Layout from "./pages/Layout";

import Editor from "./pages/Editor/Editor";
import Upload from "./pages/Editor/Upload";
import Captions from "./pages/Editor/Captions";
import Translate from "./pages/Editor/Translate";
import Export from "./pages/Editor/Export";
import Preview from "./pages/Editor/Preview";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify" element={<VerifyPassword />} />
          <Route path="/send-verification-email" element={<SendEmail />} />
          <Route path="/resend-verification-email" element={<VerifyEmail />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/me" element={<MyProfile />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/change-password" element={<ChangePassword />} />

          <Route path="/editor" element={<Editor />}>
            <Route path="/editor" element={<Upload />} />
            <Route path="/editor/upload" element={<Upload />} />
            <Route path="/editor/upload/captions" element={<Captions />} />
            <Route path="/editor/upload/captions/translate" element={<Translate />} />
            <Route path="/editor/upload/captions/translate/preview" element={<Preview />} />
            <Route path="/editor/upload/captions/translate/preview/export" element={<Export />} />
          </Route>

          </Route>
          <Route path="/profile" element={<Navigate to="/me" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;