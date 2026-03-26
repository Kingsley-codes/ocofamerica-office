// /lib/auth.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// Check if we're in the browser
const isBrowser = () => typeof window !== "undefined";

// Login user
export const authenticateUser = async (email, password) => {
  try {
    console.log("Sending login request to:", `${API_URL}/auth/login`);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `Login failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
};

// Login admin
export const authenticateAdmin = async (email, password) => {
  try {
    console.log("Sending login request to:", `${API_URL}/admin/auth/login`);

    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(
        data.message || `Login failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
};

// Verify 2FA token
export const verifyTwoFactorToken = async (email, token) => {
  try {
    // Get temp token from session storage
    let tempToken = null;
    let pendingEmail = null;

    if (isBrowser()) {
      tempToken = sessionStorage.getItem("temp_auth_token");
      pendingEmail = sessionStorage.getItem("pending_2fa_email");
    }

    console.log("Verifying 2FA with:", {
      email,
      token,
      hasTempToken: !!tempToken,
      pendingEmail,
    });

    if (!tempToken) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}/auth/verify-2fa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({ email, token }),
    });

    // Parse response data
    const data = await response.json();
    console.log("2FA verification response:", data);

    if (!response.ok) {
      throw new Error(data.message || "2FA verification failed");
    }

    // Clear temporary data
    if (isBrowser()) {
      sessionStorage.removeItem("temp_auth_token");
      sessionStorage.removeItem("pending_2fa_email");
      sessionStorage.removeItem("pending_2fa_user");

      // Store new auth data
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        console.log("Auth token saved to localStorage");
      }
      if (data.sessionId) {
        localStorage.setItem("session_id", data.sessionId);
        console.log("Session ID saved to localStorage");
      }
    }

    return data;
  } catch (error) {
    console.error("2FA verification error:", error);
    return {
      success: false,
      message: error.message || "Verification failed",
    };
  }
};

// Verify 2FA token
export const verifyAdminTwoFactorToken = async (email, token) => {
  try {
    // Get temp token from session storage
    let tempToken = null;
    let pendingEmail = null;

    if (isBrowser()) {
      tempToken = sessionStorage.getItem("admin_temp_auth_token");
      pendingEmail = sessionStorage.getItem("admin_pending_2fa_email");
    }

    console.log("Verifying 2FA with:", {
      email,
      token,
      hasTempToken: !!tempToken,
      pendingEmail,
    });

    if (!tempToken) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}/admin/auth/verify-2fa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({ email, token }),
    });

    // Parse response data
    const data = await response.json();
    console.log("2FA verification response:", data);

    if (!response.ok) {
      throw new Error(data.message || "2FA verification failed");
    }

    // Clear temporary data
    if (isBrowser()) {
      sessionStorage.removeItem("admin_temp_auth_token");
      sessionStorage.removeItem("admin_pending_2fa_email");
      sessionStorage.removeItem("admin_pending_2fa_user");

      // Store new auth data
      if (data.token) {
        localStorage.setItem("admin_auth_token", data.token);
        console.log("Admin auth token saved to localStorage");
      }
      if (data.sessionId) {
        localStorage.setItem("admin_session_id", data.sessionId);
        console.log("Admin Session ID saved to localStorage");
      }
    }

    return data;
  } catch (error) {
    console.error("2FA verification error:", error);
    return {
      success: false,
      message: error.message || "Verification failed",
    };
  }
};

// Resend 2FA code
export const resend2FACode = async (email) => {
  try {
    const tempToken = sessionStorage.getItem("temp_auth_token");

    if (!tempToken) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}/auth/resend-2fa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log("Resend 2FA response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend code");
    }

    // Update temp token in session storage
    if (data.tempToken && isBrowser()) {
      sessionStorage.setItem("temp_auth_token", data.tempToken);
      console.log("Updated temp token in session storage");
    }

    return data;
  } catch (error) {
    console.error("Resend 2FA error:", error);
    return {
      success: false,
      message: error.message || "Failed to resend code",
    };
  }
};

// Resend admin 2FA code
export const resendAdmin2FACode = async (email) => {
  try {
    const tempToken = sessionStorage.getItem("admin_temp_auth_token");

    if (!tempToken) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(`${API_URL}/admin/auth/resend-2fa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log("Resend 2FA response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend code");
    }

    // Update temp token in session storage
    if (data.tempToken && isBrowser()) {
      sessionStorage.setItem("admin_temp_auth_token", data.tempToken);
      console.log("Updated admin temp token in session storage");
    }

    return data;
  } catch (error) {
    console.error("Resend 2FA error:", error);
    return {
      success: false,
      message: error.message || "Failed to resend code",
    };
  }
};

// Generate QR code for 2FA setup
export const generateQRCode = async () => {
  try {
    if (!isBrowser()) return null;

    // For first-time setup, use temp token from session
    const token =
      sessionStorage.getItem("temp_auth_token") ||
      localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/auth/qr-code`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to generate QR code");
    }

    return data.qrCode;
  } catch (error) {
    console.error("QR code generation error:", error);
    return null;
  }
};

// Enable 2FA
export const enable2FA = async (token) => {
  try {
    if (!isBrowser()) {
      return {
        success: false,
        message: "Browser required",
      };
    }

    const authToken = localStorage.getItem("auth_token");

    if (!authToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/auth/enable-2fa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to enable 2FA");
    }

    return data;
  } catch (error) {
    console.error("Enable 2FA error:", error);
    return {
      success: false,
      message: error.message || "Failed to enable 2FA",
    };
  }
};

// Disable 2FA
export const disable2FA = async () => {
  try {
    if (!isBrowser()) {
      return {
        success: false,
        message: "Browser required",
      };
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/auth/disable-2fa`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to disable 2FA");
    }

    return data;
  } catch (error) {
    console.error("Disable 2FA error:", error);
    return {
      success: false,
      message: error.message || "Failed to disable 2FA",
    };
  }
};

// Validate session
export const validateSession = async () => {
  try {
    if (!isBrowser()) {
      return { valid: false };
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      return { valid: false };
    }

    const response = await fetch(`${API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Clear invalid session
      localStorage.removeItem("auth_token");
      localStorage.removeItem("session_id");
      return { valid: false };
    }

    return {
      valid: true,
      user: data.user,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { valid: false };
  }
};

// Validate session
export const validateAdminSession = async () => {
  try {
    if (!isBrowser()) {
      return { valid: false };
    }

    const token = localStorage.getItem("admin_auth_token");

    if (!token) {
      return { valid: false };
    }

    const response = await fetch(`${API_URL}/admin/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Clear invalid session
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem("admin_session_id");
      return { valid: false };
    }

    return {
      valid: true,
      admin: data.admin,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { valid: false };
  }
};

// Logout
export const logout = async () => {
  try {
    if (!isBrowser()) return;

    const token = localStorage.getItem("auth_token");

    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage
    if (isBrowser()) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("session_id");
      sessionStorage.removeItem("temp_auth_token");
      sessionStorage.removeItem("pending_2fa_email");
      sessionStorage.removeItem("pending_2fa_user");
    }
  }
};

export const adminlogout = async () => {
  try {
    if (!isBrowser()) return;

    const token = localStorage.getItem("admin_auth_token");

    if (token) {
      await fetch(`${API_URL}/admin/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage
    if (isBrowser()) {
      localStorage.removeItem("admin_auth_token");
      localStorage.removeItem("admin_session_id");
      sessionStorage.removeItem("admin_temp_auth_token");
      sessionStorage.removeItem("admin_pending_2fa_email");
      sessionStorage.removeItem("admin_pending_2fa_user");
    }
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/request-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password reset request failed");
    }

    return data;
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      success: false,
      message: error.message || "Request failed",
    };
  }
};

export const requestAdminPasswordReset = async (email) => {
  try {
    const response = await fetch(
      `${API_URL}/admin/auth/request-password-reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password reset request failed");
    }

    return data;
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      success: false,
      message: error.message || "Request failed",
    };
  }
};

// Reset password
export const resetPassword = async (token, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password reset failed");
    }

    return data;
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: error.message || "Reset failed",
    };
  }
};

export const resetAdminPassword = async (token, password) => {
  try {
    const response = await fetch(`${API_URL}/admin/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password reset failed");
    }

    return data;
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: error.message || "Reset failed",
    };
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    if (!isBrowser()) {
      return {
        success: false,
        message: "Browser required",
      };
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password change failed");
    }

    return data;
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: error.message || "Change failed",
    };
  }
};

export const changeAdminPassword = async (currentPassword, newPassword) => {
  try {
    if (!isBrowser()) {
      return {
        success: false,
        message: "Browser required",
      };
    }

    const token = localStorage.getItem("admin_auth_token");

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/admin/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Password change failed");
    }

    return data;
  } catch (error) {
    console.error("Change password error:", error);
    return {
      success: false,
      message: error.message || "Change failed",
    };
  }
};

// Get user data
export const getUserData = async () => {
  try {
    if (!isBrowser()) {
      return null;
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Get user data error:", error);
    return null;
  }
};

export const getAdminData = async () => {
  try {
    if (!isBrowser()) {
      return null;
    }

    const token = localStorage.getItem("admin_auth_token");

    if (!token) {
      return null;
    }

    const response = await fetch(`${API_URL}/admin/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Get user data error:", error);
    return null;
  }
};

// Make authenticated API requests
export const apiRequest = async (endpoint, options = {}) => {
  try {
    if (!isBrowser()) {
      throw new Error("Browser required");
    }

    const token = localStorage.getItem("auth_token");

    if (!token) {
      throw new Error("Not authenticated");
    }

    // Create headers
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    // Prepare request body
    let body = options.body;
    if (body && typeof body === "object") {
      body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options.method || "GET",
      headers,
      body,
    });

    // Handle unauthorized
    if (response.status === 401 && isBrowser()) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("session_id");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    // Check if this is a file download request
    const contentType = response.headers.get("content-type") || "";
    const isFileDownload =
      endpoint.includes("/export") ||
      contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ) ||
      contentType.includes("application/pdf") ||
      contentType.includes("text/csv") ||
      contentType.includes("application/octet-stream");

    if (isFileDownload) {
      // For file downloads, return the blob
      const blob = await response.blob();

      if (!response.ok) {
        // Try to read error message from blob if it's JSON
        try {
          const errorText = await blob.text();
          const errorData = JSON.parse(errorText);
          throw new Error(
            errorData.message || `Export failed with status ${response.status}`,
          );
        } catch {
          throw new Error(`Export failed with status ${response.status}`);
        }
      }

      return blob;
    }

    // For non-file requests, expect JSON
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON but got: ${contentType}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

// Get current 2FA code (for development)
export const getCurrent2FACode = (email) => {
  // In production, this would be generated by the authenticator app
  // For development, we can simulate it
  if (process.env.NODE_ENV === "development") {
    return "123456";
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  if (!isBrowser()) return false;
  return !!localStorage.getItem("auth_token");
};

// Clear all authentication data
export const clearAuthData = () => {
  if (isBrowser()) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("session_id");
    sessionStorage.removeItem("temp_auth_token");
    sessionStorage.removeItem("pending_2fa_email");
    sessionStorage.removeItem("pending_2fa_user");
  }
};
