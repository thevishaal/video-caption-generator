import { toast } from "react-toastify";
import React from "react";

const customToastStyles = {
  success: "!bg-emerald-500 !text-white !rounded-2xl !shadow-2xl !px-6 !py-4 font-semibold text-sm !flex !items-center !gap-3 border-none",
  error: "!bg-red-500 !text-white !rounded-2xl !shadow-2xl !px-6 !py-4 font-semibold text-sm !flex !items-center !gap-3 border-none",
  info: "!bg-slate-700 !text-white !rounded-2xl !shadow-2xl !px-6 !py-4 font-semibold text-sm !flex !items-center !gap-3 border-none",
  loading: "!bg-[#128189] !text-white !rounded-2xl !shadow-2xl !px-6 !py-4 font-semibold text-sm !flex !items-center !gap-3 border-none",
  warning: "!bg-amber-500 !text-white !rounded-2xl !shadow-2xl !px-6 !py-4 font-semibold text-sm !flex !items-center !gap-3 border-none",
};

export const formatServerError = (serverErrors) => {
  if (!serverErrors) return "An unexpected error occurred.";
  
  if (typeof serverErrors === "string") {
    return serverErrors;
  }
  
  try {
    const firstKey = Object.keys(serverErrors)[0];
    let errorMsg = serverErrors[firstKey];
    if (Array.isArray(errorMsg)) {
      errorMsg = errorMsg[0];
    }
    
    if (typeof errorMsg !== "string") {
      return "An error occurred. Please check your input.";
    }

    const fieldName = firstKey.replace('_', ' ').toLowerCase();
    
    // Check common messages and format them beautifully
    if (errorMsg.toLowerCase().includes("already exists") && fieldName.includes("email")) {
      return "An account with this email address already exists.";
    }
    
    if (errorMsg.toLowerCase().includes("blank") || errorMsg.toLowerCase().includes("required")) {
      const fieldTitle = firstKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${fieldTitle} is required.`;
    }
    
    if (errorMsg.toLowerCase().includes("at least") || errorMsg.toLowerCase().includes("short")) {
      const fieldTitle = firstKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
      return `${fieldTitle} is too short or doesn't meet requirements.`;
    }

    // If the error message already has the field name or is descriptive, return it capitalized
    if (errorMsg.toLowerCase().includes(fieldName)) {
      return errorMsg.charAt(0).toUpperCase() + errorMsg.slice(1);
    }
    
    // Otherwise, return a capitalized Field: Message format
    const formattedField = firstKey.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `${formattedField}: ${errorMsg}`;
  } catch (e) {
    return "Invalid data provided.";
  }
};

export const showToast = {
  success: (msg) => {
    return toast.success(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      className: customToastStyles.success,
      bodyClassName: "!text-white font-semibold text-sm !p-0 !m-0 !flex !items-center !gap-3",
      icon: <i className="fa-solid fa-circle-check text-white text-base" />
    });
  },
  error: (msg) => {
    return toast.error(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      className: customToastStyles.error,
      bodyClassName: "!text-white font-semibold text-sm !p-0 !m-0 !flex !items-center !gap-3",
      icon: <i className="fa-solid fa-circle-exclamation text-white text-base" />
    });
  },
  loading: (msg) => {
    return toast(msg, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: customToastStyles.loading,
      bodyClassName: "!text-white font-semibold text-sm !p-0 !m-0 !flex !items-center !gap-3",
      icon: <i className="fa-solid fa-circle-notch fa-spin text-white text-base" />
    });
  },
  info: (msg) => {
    return toast.info(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      className: customToastStyles.info,
      bodyClassName: "!text-white font-semibold text-sm !p-0 !m-0 !flex !items-center !gap-3",
      icon: <i className="fa-solid fa-circle-info text-white text-base" />
    });
  },
  warning: (msg) => {
    return toast.warning(msg, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      closeButton: false,
      className: customToastStyles.warning,
      bodyClassName: "!text-white font-semibold text-sm !p-0 !m-0 !flex !items-center !gap-3",
      icon: <i className="fa-solid fa-triangle-exclamation text-white text-base" />
    });
  },
  dismiss: (toastId) => {
    if (toastId != null) {
      toast.dismiss(toastId);
    }
  }
};
