/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  Mail,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Shield,
} from "lucide-react";
import { verifyTwoFactorToken, resend2FACode } from "@/lib/auth";

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [method, setMethod] = useState("email");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userData, setUserData] = useState(null);
  const [hasPendingData, setHasPendingData] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    setIsClient(true);

    const checkPendingData = () => {
      if (typeof window === "undefined") return;

      const email = sessionStorage.getItem("pending_2fa_email");
      const user = sessionStorage.getItem("pending_2fa_user");
      const tempToken = sessionStorage.getItem("temp_auth_token");

      if (!email || !tempToken) {
        console.log("Missing data, redirecting to login");
        router.push("/login");
        return;
      }

      setHasPendingData(true);
      setUserEmail(email);

      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          setUserData(parsedUser);

          // Always use email method for now
          setMethod("email");

          // Check if this is a first-time user (2FA not enabled)
          const isFirstTime = !parsedUser.twoFactorEnabled;
          setIsFirstTimeSetup(isFirstTime);

          // For returning users, auto-focus the input
          if (!isFirstTime) {
            console.log("Returning user, auto-focusing input...");
            setTimeout(() => {
              if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
              }
            }, 100);
          }
        } catch (err) {
          console.error("Error parsing user data:", err);
        }
      }
    };

    checkPendingData();

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleVerifyDirect = async (token) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await verifyTwoFactorToken(userEmail, token);

      if (result.success) {
        setSuccessMessage("Verification successful! Redirecting...");
        setCode(["", "", "", "", "", ""]);

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("temp_auth_token");
          sessionStorage.removeItem("pending_2fa_email");
          sessionStorage.removeItem("pending_2fa_user");
          sessionStorage.removeItem("temp_2fa_secret");
        }

        if (result.token) {
          localStorage.setItem("auth_token", result.token);
        }
        if (result.sessionId) {
          localStorage.setItem("session_id", result.sessionId);
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setError(result.message || "Invalid verification code");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 10);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FADirect = async (token) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const result = await verifyTwoFactorToken(userEmail, token);

      if (result.success) {
        setSuccessMessage("2FA enabled successfully! Redirecting...");

        if (typeof window !== "undefined") {
          sessionStorage.removeItem("temp_2fa_secret");
        }

        if (result.token) {
          localStorage.setItem("auth_token", result.token);
        }
        if (result.sessionId) {
          localStorage.setItem("session_id", result.sessionId);
        }

        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setError(result.message || "Failed to enable 2FA");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 10);
      }
    } catch (error) {
      console.error("Enable 2FA error:", error);
      setError("Failed to enable 2FA. Please try again.");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }

    // Check if all digits are filled using the NEW code array
    const isComplete =
      newCode.every((digit) => digit !== "") && newCode.length === 6;

    if (isComplete) {
      // Use the newCode array directly for verification
      setTimeout(() => {
        const token = newCode.join("");
        if (token.length === 6) {
          if (isFirstTimeSetup && codeRequested) {
            // Pass the token directly to avoid state timing issues
            handleEnable2FADirect(token);
          } else {
            // Pass the token directly to avoid state timing issues
            handleVerifyDirect(token);
          }
        }
      }, 50);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const currentCode = code.join("");
      if (currentCode.length === 6) {
        if (isFirstTimeSetup && codeRequested) {
          handleEnable2FADirect(currentCode);
        } else {
          handleVerifyDirect(currentCode);
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setCode(digits);

      // Use direct verification with the pasted token
      setTimeout(() => {
        if (isFirstTimeSetup && codeRequested) {
          handleEnable2FADirect(pastedData);
        } else {
          handleVerifyDirect(pastedData);
        }
      }, 50);
    }
  };

  // Update the existing handleVerify and handleEnable2FA to work with manual button clicks
  const handleVerify = async () => {
    const token = code.join("");
    await handleVerifyDirect(token);
  };

  const handleEnable2FA = async () => {
    const token = code.join("");
    await handleEnable2FADirect(token);
  };

  const handleResendCode = async () => {
    if (isResending || (timeLeft > 0 && !isFirstTimeSetup)) return;

    setIsResending(true);
    setError("");
    setSuccessMessage("");

    try {
      const tempToken = sessionStorage.getItem("temp_auth_token");
      const result = await resend2FACode(userEmail, tempToken);

      if (result.success) {
        // Update the temp token in sessionStorage
        if (result.tempToken) {
          sessionStorage.setItem("temp_auth_token", result.tempToken);
        }

        if (isFirstTimeSetup) {
          setSuccessMessage("Verification code sent to your email!");
          setCodeRequested(true);
        } else {
          setSuccessMessage("New verification code sent to your email!");
        }
        setTimeLeft(30);
        setCode(["", "", "", "", "", ""]);

        // Auto-focus first input after sending code
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        setError(result.message || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleUseBackupCode = () => {
    // Always use "123456" for development
    const devCode = "123456";
    const digits = devCode.split("");
    setCode(digits);

    // Give a moment for state to update, then verify
    setTimeout(() => {
      if (isFirstTimeSetup && codeRequested) {
        handleEnable2FADirect(devCode);
      } else {
        handleVerifyDirect(devCode);
      }
    }, 100);
  };

  const handleGoBack = () => {
    setCodeRequested(false);
    setCode(["", "", "", "", "", ""]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            {isFirstTimeSetup ? (
              <Shield className="h-8 w-8 text-blue-600" />
            ) : (
              <Key className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isFirstTimeSetup
              ? "Set Up Two-Factor Authentication"
              : "Two-Factor Authentication"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isFirstTimeSetup
              ? "For security, all users must set up 2FA to access the system."
              : "Enter the 6-digit code sent to your email"}
          </p>
        </div>

        {successMessage && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {isFirstTimeSetup ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    Security Requirement
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Two-factor authentication is now required for all users to
                    enhance account security.
                  </p>
                </div>
              </div>
            </div>

            {/* Show different UI based on whether code has been sent */}
            {!codeRequested ? (
              <div className="rounded-lg border border-gray-200 p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Get Started with 2FA Setup
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Click the button below to receive a verification code at{" "}
                  <strong>{userEmail}</strong>. You&apos;ll need this code to
                  enable two-factor authentication.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">
                    What to expect:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>
                        Click &ldquo;Send Verification Code&ldquo; below
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Check your email for a 6-digit code</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Enter the code to enable 2FA</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">4.</span>
                      <span>You&apos;ll be automatically logged in</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isResending ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending Code...
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Enter Verification Code
                  </h3>
                  <p className="text-sm text-gray-600">
                    We&apos;ve sent a 6-digit code to{" "}
                    <strong>{userEmail}</strong>. Enter it below to enable
                    two-factor authentication.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center space-x-3">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) =>
                          handleCodeChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-14 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                        disabled={isLoading}
                        autoComplete="off"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-800">
                            Verification Error
                          </p>
                          <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleEnable2FA}
                    disabled={isLoading || code.some((c) => !c)}
                    className="w-full py-3 px-4 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      "Enable 2FA & Continue"
                    )}
                  </button>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleResendCode}
                      disabled={timeLeft > 0 || isResending || isLoading}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 transition-colors"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-1 ${
                          isResending ? "animate-spin" : ""
                        }`}
                      />
                      {isResending
                        ? "Sending..."
                        : timeLeft > 0
                          ? `Resend code (${timeLeft}s)`
                          : "Resend code"}
                    </button>
                  </div>

                  <button
                    onClick={handleGoBack}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all"
                  disabled={isLoading}
                  autoComplete="off"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Verification Error
                    </p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleVerify}
                disabled={isLoading || code.some((c) => !c)}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleResendCode}
                  disabled={timeLeft > 0 || isResending || isLoading}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400 transition-colors"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${
                      isResending ? "animate-spin" : ""
                    }`}
                  />
                  {isResending
                    ? "Sending..."
                    : timeLeft > 0
                      ? `Resend code (${timeLeft}s)`
                      : "Resend code"}
                </button>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="text-center">
                  <button
                    onClick={handleUseBackupCode}
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-500"
                  >
                    Use Development Code (123456)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Need help?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check your email inbox (and spam folder)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Codes expire after 10 minutes</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Contact admin if you need assistance</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Never share your verification codes</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
