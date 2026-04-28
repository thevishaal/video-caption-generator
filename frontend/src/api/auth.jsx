import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/", // Django URL
});

// attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("access_token");

  // routes where token should NOT be sent
  const publicRoutes = [
    "/login/",
    "/register/",
    "/forgot-password/",
    "/resend-verification-email/",
  ];

  const isPublic = publicRoutes.some((route) =>
    req.url.includes(route)
  );

  if (token && !isPublic) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// -------- AUTH APIs --------

export const registerUser = (data) => API.post("register/", data);

export const loginUser = (data) => API.post("login/", data);

export const forgotPassword = (data) => API.post("forgot-password/", data);

export const resendVerification = (data) =>
  API.post("resend-verification-email/", data);

export const getMe = () => API.get("me/");

export const logoutUser = (refresh_token) =>
  API.post("logout/", { refresh_token });
