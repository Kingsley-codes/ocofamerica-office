// components/dashboard/Volunteers.js
"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  Search,
  Download,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronDown,
  Users,
  AlertCircle,
  UserCog,
  Lock,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Trash,
  Mail,
  Clock,
  DollarSign,
  Briefcase,
  User,
  FileText,
  Activity,
  Shield,
  Info,
  Sun,
  SunDim,
  Moon,
  Megaphone,
  Truck,
  PenTool,
  Star,
  Award,
  ChevronUp,
  Home,
  MessageSquare,
  CalendarDays,
  Flag,
  Car,
  CreditCard,
  MailOpen,
  FileSignature,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import AgreementModal from "../AgreementModal";

// Helper function to get auth token
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

// Helper function to get session ID
const getSessionId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("session_id");
};

// API Service for backend integration
const volunteerService = {
  async getVolunteers(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        cleanParams[key] = params[key];
      }
    });

    const queryParams = new URLSearchParams(cleanParams).toString();
    const token = getAuthToken();
    const sessionId = getSessionId();

    const response = await fetch(
      `/api/volunteers${queryParams ? `?${queryParams}` : ""}`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to fetch volunteers");
    }
    return await response.json();
  },

  async addVolunteer(data) {
    const token = getAuthToken();

    const response = await fetch("/api/volunteers", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to add volunteer");
    }
    return await response.json();
  },

  async updateVolunteer(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to update volunteer");
    }
    return await response.json();
  },

  async deleteVolunteer(id) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to delete volunteer");
    }
    return await response.json();
  },

  async promoteVolunteer(id) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/promote`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to promote volunteer");
    }
    return await response.json();
  },

  async updateAccess(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/access`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to update access");
    }
    return await response.json();
  },

  async changePassword(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/change-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to change password");
    }
    return await response.json();
  },

  async resetPassword(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to reset password");
    }
    return await response.json();
  },

  async exportVolunteers(type = "all") {
    const token = getAuthToken();
    const url =
      type !== "all"
        ? `/api/volunteers/export?type=${type}`
        : "/api/volunteers/export";

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to export volunteers");
    }
    return await response.json();
  },

  async addHours(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/hours`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to add hours");
    }
    return await response.json();
  },

  async updateW9Form(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/w9`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to update W9 form");
    }
    return await response.json();
  },

  async updateAssignments(id, data) {
    const token = getAuthToken();

    const response = await fetch(`/api/volunteers/${id}/assignments`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("session_id");
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      throw new Error(error.error || "Failed to update assignments");
    }
    return await response.json();
  },
};

const Volunteers = ({ user }) => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showW9Modal, setShowW9Modal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [agreementUser, setAgreementUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [hoursData, setHoursData] = useState({
    hours: "",
    date: new Date().toISOString().split("T")[0],
    activity: "",
  });
  const [w9FormData, setW9FormData] = useState({
    w9Form: "",
    submittedDate: new Date().toISOString().split("T")[0],
  });
  const [assignmentsData, setAssignmentsData] = useState([]);

  const [volunteerForm, setVolunteerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    type: "volunteer",
    location: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    assignedTo: [],
    createAccount: true,
    password: "",
    confirmPassword: "",
    accessLevel: "volunteer",
    hourlyRate: "",
    availability: "any",
    days: "anyday",
    preferredRoles: [],
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    sendEmail: true,
  });

  useEffect(() => {
    if (user && user.role === "admin") {
      setIsAdmin(true);
    }
    fetchVolunteers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedType, pagination.page]);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedType !== "all") {
        params.type = selectedType;
      }

      if (searchTerm && searchTerm.trim() !== "") {
        params.search = searchTerm;
      }

      const result = await volunteerService.getVolunteers(params);
      setVolunteers(result.volunteers || []);
      setPagination(
        result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        },
      );
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchVolunteers();
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedType]);

  const handleViewDetails = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowViewModal(true);
  };

  const handleViewAgreements = (volunteer) => {
    setAgreementUser(volunteer);
    setShowAgreementModal(true);
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Only administrators can add volunteers/field staff.");
      return;
    }

    if (volunteerForm.password !== volunteerForm.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (volunteerForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const volunteerData = {
        firstName: volunteerForm.firstName,
        lastName: volunteerForm.lastName,
        email: volunteerForm.email,
        phone: volunteerForm.phone,
        dateOfBirth: volunteerForm.dateOfBirth,
        role: volunteerForm.type,
        location: volunteerForm.location,
        address: volunteerForm.address,
        city: volunteerForm.city,
        state: volunteerForm.state,
        zip: volunteerForm.zip,
        assignedTo: volunteerForm.assignedTo,
        status: "active",
        password: volunteerForm.password,
        accessLevel: volunteerForm.accessLevel,
        hourlyRate: volunteerForm.hourlyRate
          ? parseFloat(volunteerForm.hourlyRate)
          : undefined,
        availability: volunteerForm.availability,
        preferredDays: volunteerForm.days,
        preferredRoles: volunteerForm.preferredRoles,
      };

      await volunteerService.addVolunteer(volunteerData);

      toast.success("Volunteer added successfully");

      setShowAddModal(false);
      resetForm();
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVolunteer = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can edit volunteers.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setVolunteerForm({
      firstName: volunteer.firstName,
      lastName: volunteer.lastName,
      email: volunteer.email,
      phone: volunteer.phone || "",
      dateOfBirth: volunteer.dateOfBirth
        ? new Date(volunteer.dateOfBirth).toISOString().split("T")[0]
        : "",
      type: volunteer.role,
      location: volunteer.location || "",
      address: volunteer.address || "",
      city: volunteer.city || "",
      state: volunteer.state || "",
      zip: volunteer.zip || "",
      assignedTo: volunteer.assignedTo || [],
      createAccount: true,
      password: "",
      confirmPassword: "",
      accessLevel: volunteer.role,
      hourlyRate: volunteer.hourlyRate || "",
      availability: volunteer.availability || "any",
      days: volunteer.preferredDays || "anyday",
      preferredRoles: volunteer.preferredRoles || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateVolunteer = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedVolunteer) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        firstName: volunteerForm.firstName,
        lastName: volunteerForm.lastName,
        phone: volunteerForm.phone,
        dateOfBirth: volunteerForm.dateOfBirth,
        location: volunteerForm.location,
        address: volunteerForm.address,
        city: volunteerForm.city,
        state: volunteerForm.state,
        zip: volunteerForm.zip,
        assignedTo: volunteerForm.assignedTo,
        hourlyRate: volunteerForm.hourlyRate
          ? parseFloat(volunteerForm.hourlyRate)
          : undefined,
        availability: volunteerForm.availability,
        preferredDays: volunteerForm.days,
        preferredRoles: volunteerForm.preferredRoles,
      };

      await volunteerService.updateVolunteer(selectedVolunteer._id, updateData);

      toast.success("Volunteer updated successfully");

      setShowEditModal(false);
      resetForm();
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVolunteer = async (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete volunteers.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${volunteer.firstName} ${volunteer.lastName}?`,
      )
    ) {
      return;
    }

    try {
      await volunteerService.deleteVolunteer(volunteer._id);

      toast.success("Volunteer deleted successfully");
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can change passwords.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setShowPasswordModal(true);
  };

  const handleResetPassword = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can reset passwords.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setShowResetModal(true);
  };

  const handlePromoteToStaff = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can promote volunteers to staff.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setShowPromoteModal(true);
  };

  const handleManageAccess = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can manage user access.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setVolunteerForm({
      ...volunteerForm,
      email: volunteer.email,
      createAccount: true,
      accessLevel: volunteer.role,
    });
    setShowAccessModal(true);
  };

  const handleAddHours = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowHoursModal(true);
  };

  const handleUpdateW9 = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can update W9 forms.");
      return;
    }

    if (volunteer.role !== "field_staff") {
      toast.error("Only field staff require W9 forms.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setW9FormData({
      w9Form: volunteer.w9Form || "",
      submittedDate: new Date().toISOString().split("T")[0],
    });
    setShowW9Modal(true);
  };

  const handleUpdateAssignments = (volunteer) => {
    if (!isAdmin) {
      toast.error("Only administrators can update assignments.");
      return;
    }

    setSelectedVolunteer(volunteer);
    setAssignmentsData(volunteer.assignedTo || []);
    setShowAssignmentsModal(true);
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedVolunteer) return;

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      await volunteerService.changePassword(selectedVolunteer._id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPasswordReset = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedVolunteer) return;

    setIsSubmitting(true);
    try {
      const response = await volunteerService.resetPassword(
        selectedVolunteer._id,
        resetPasswordForm,
      );

      toast.success("Password reset initiated successfully");

      if (response.newPassword && !resetPasswordForm.sendEmail) {
        toast.success(`New temporary password: ${response.newPassword}`);
      }

      setShowResetModal(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitHours = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer || !hoursData.hours) {
      toast.error("Please enter hours");
      return;
    }

    setIsSubmitting(true);
    try {
      await volunteerService.addHours(selectedVolunteer._id, {
        hours: parseFloat(hoursData.hours),
        date: hoursData.date,
        activity: hoursData.activity,
      });

      toast.success("Hours added successfully");

      setShowHoursModal(false);
      setHoursData({
        hours: "",
        date: new Date().toISOString().split("T")[0],
        activity: "",
      });
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitW9 = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer || !w9FormData.w9Form) {
      toast.error("Please enter W9 form details");
      return;
    }

    setIsSubmitting(true);
    try {
      await volunteerService.updateW9Form(selectedVolunteer._id, {
        w9Form: w9FormData.w9Form,
        submittedDate: w9FormData.submittedDate,
      });

      toast.success("W9 form updated successfully");

      setShowW9Modal(false);
      setW9FormData({
        w9Form: "",
        submittedDate: new Date().toISOString().split("T")[0],
      });
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAssignments = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer) return;

    setIsSubmitting(true);
    try {
      await volunteerService.updateAssignments(selectedVolunteer._id, {
        assignedTo: assignmentsData,
      });

      toast.success("Assignments updated successfully");

      setShowAssignmentsModal(false);
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPromote = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedVolunteer) return;

    setIsSubmitting(true);
    try {
      await volunteerService.promoteVolunteer(selectedVolunteer._id);

      toast.success("Volunteer promoted successfully!");

      setShowPromoteModal(false);
      fetchVolunteers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageAccessSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedVolunteer) return;

    if (
      volunteerForm.password &&
      volunteerForm.password !== volunteerForm.confirmPassword
    ) {
      toast.error("Passwords do not match!");
      return;
    }

    if (volunteerForm.password && volunteerForm.password.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const accessData = {
        accessLevel: volunteerForm.accessLevel,
      };

      if (volunteerForm.password) {
        accessData.password = volunteerForm.password;
      }

      await volunteerService.updateAccess(selectedVolunteer._id, accessData);

      toast.success("Access updated successfully!");

      setShowAccessModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await volunteerService.exportVolunteers(selectedType);

      const headers = [
        "Name",
        "Email",
        "Phone",
        "Type",
        "Location",
        "Hours",
        "Status",
        "Join Date",
        "W9 Form",
        "Agreements",
        "Availability",
        "Preferred Days",
        "Preferred Roles",
      ];
      const rows = data.volunteers.map((v) => [
        `${v.firstName} ${v.lastName}`,
        v.email,
        v.phone || "",
        v.role === "field_staff" ? "Field Staff" : "Volunteer",
        v.location || "",
        v.hours || 0,
        v.status,
        formatDate(v.joinDate),
        v.w9Form || "N/A",
        v.agreements ? "Signed" : "Pending",
        v.availability || "any",
        v.preferredDays || "anyday",
        (v.preferredRoles || []).join("; "),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `volunteers_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Export completed successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setVolunteerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      type: "volunteer",
      location: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      assignedTo: [],
      createAccount: true,
      password: "",
      confirmPassword: "",
      accessLevel: "volunteer",
      hourlyRate: "",
      availability: "any",
      days: "anyday",
      preferredRoles: [],
    });
  };

  const getRequiredAgreementsForRole = (role) => {
    switch (role) {
      case "admin":
        return ["staffer", "contractor"];
      case "field_staff":
        return ["staffer", "contractor"];
      case "volunteer":
        return ["volunteer"];
      case "manager":
      case "finance":
      case "field":
      case "media":
      case "legal":
      case "candidate":
        return ["staffer"];
      default:
        return [];
    }
  };

  const getAgreementStatus = (volunteer) => {
    if (!volunteer.agreements) return "not_signed";

    const requiredAgreements = getRequiredAgreementsForRole(volunteer.role);

    if (requiredAgreements.length === 0) return "not_required";

    const signedAgreements = requiredAgreements.filter(
      (type) => volunteer.agreements[type]?.agreed,
    );

    if (signedAgreements.length === requiredAgreements.length) {
      return "fully_signed";
    } else if (signedAgreements.length > 0) {
      return "partially_signed";
    }
    return "not_signed";
  };

  const renderAgreementStatus = (volunteer) => {
    const status = getAgreementStatus(volunteer);

    if (status === "not_required") {
      return null;
    }

    const colors = {
      fully_signed: "bg-green-100 text-green-800",
      partially_signed: "bg-yellow-100 text-yellow-800",
      not_signed: "bg-red-100 text-red-800",
    };

    const labels = {
      fully_signed: "Agreements ✓",
      partially_signed: "Partial",
      not_signed: "No Agreements",
    };

    return (
      <span
        className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const assignmentOptions = [
    "canvassing",
    "phone_banking",
    "events",
    "training",
    "team_lead",
    "other",
  ];

  const renderAdminActions = (person) => (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => handleViewDetails(person)}
        className="text-blue-600 hover:text-blue-900 text-xs font-medium px-2 py-1 hover:bg-blue-50 rounded"
        title="View Details"
      >
        View
      </button>
      <button
        onClick={() => handleViewAgreements(person)}
        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium px-2 py-1 hover:bg-indigo-50 rounded"
        title="View Agreements"
      >
        <FileText className="h-3 w-3 mr-1" />
        Agreements
      </button>
      <button
        onClick={() => handleAddHours(person)}
        className="text-green-600 hover:text-green-900 text-xs font-medium px-2 py-1 hover:bg-green-50 rounded"
        title="Add Hours"
      >
        + Hours
      </button>
      <button
        onClick={() => handleEditVolunteer(person)}
        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium px-2 py-1 hover:bg-indigo-50 rounded inline-flex items-center"
        title="Edit Volunteer"
      >
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </button>
      {person._id !== user?.id && (
        <button
          onClick={() => handleDeleteVolunteer(person)}
          className="text-red-600 hover:text-red-900 text-xs font-medium px-2 py-1 hover:bg-red-50 rounded"
          title="Delete Volunteer"
        >
          <Trash className="h-3 w-3 inline mr-1" />
        </button>
      )}
    </div>
  );

  const renderUserActions = (person) => (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => handleViewDetails(person)}
        className="text-blue-600 hover:text-blue-900 text-xs font-medium px-2 py-1 hover:bg-blue-50 rounded"
        title="View Details"
      >
        View
      </button>
      <button
        onClick={() => handleViewAgreements(person)}
        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium px-2 py-1 hover:bg-indigo-50 rounded"
        title="View Agreements"
      >
        <FileText className="h-3 w-3 mr-1" />
        Agreements
      </button>
      <button
        className="text-gray-300 cursor-not-allowed text-xs font-medium px-2 py-1"
        title="Admin access required"
      >
        + Hours
      </button>
      <button className="text-gray-300 cursor-not-allowed text-xs font-medium px-2 py-1 inline-flex items-center">
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </button>
    </div>
  );

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-3 sm:px-6 py-3 bg-white border-t border-gray-200">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.max(1, prev.page - 1),
            }))
          }
          disabled={pagination.page === 1}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>
        <div className="flex items-center px-4">
          <span className="text-sm text-gray-700">
            {pagination.page} / {pagination.pages}
          </span>
        </div>
        <button
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              page: Math.min(pagination.pages, prev.page + 1),
            }))
          }
          disabled={pagination.page === pagination.pages}
          className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </p>
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: pageNum }))
                  }
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pagination.page === pageNum
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(pagination.pages, prev.page + 1),
                }))
              }
              disabled={pagination.page === pagination.pages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  // CAMPAIGN POSITIONS from your provided list
  const campaignPositions = [
    {
      id: "canvasser",
      label: "Canvasser",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description:
        "Door-to-door voter outreach - engage voters face-to-face in their neighborhoods",
    },
    {
      id: "sign_waver",
      label: "Sign Waver",
      icon: Megaphone,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description:
        "Visibility Ambassador - increase public awareness at high-traffic intersections",
    },
    {
      id: "phone_banker",
      label: "Phone Banker",
      icon: Phone,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description:
        "Voter Contact Specialist - call voters to share campaign information",
    },
    {
      id: "events_rally",
      label: "Events & Rally",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description:
        "Field Visibility Representative - promote at public gatherings and rallies",
    },
    {
      id: "operations",
      label: "Operations Distributor",
      icon: Truck,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description:
        "Field Logistics Coordinator - manage distribution and placement of campaign materials",
    },
    {
      id: "display_driver",
      label: "Display Driver",
      icon: Car,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      description:
        "Mobile Advertising Operator - operate vehicle with campaign signage",
    },
  ];

  // HOW TO GET INVOLVED options from your intake form
  const involvementOptions = [
    {
      id: "canvass",
      label: "Canvass / Knock Doors",
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "phone_banking",
      label: "Phone Banking",
      icon: Phone,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "fundraiser",
      label: "Host a Fundraiser",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "postcard",
      label: "Mail a Postcard",
      icon: Mail,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      id: "letter",
      label: "Write a Support Letter",
      icon: FileSignature,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      id: "other",
      label: "Other",
      icon: Star,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  const availabilityOptions = [
    {
      id: "morning",
      label: "Morning",
      icon: Sun,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      time: "Morning",
    },
    {
      id: "afternoon",
      label: "Afternoon",
      icon: SunDim,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      time: "Afternoon",
    },
    {
      id: "evening",
      label: "Evening",
      icon: Moon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      time: "Evening",
    },
    {
      id: "any",
      label: "Any",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
      time: "Any",
    },
  ];

  const dayOptions = [
    {
      id: "weekday",
      label: "Weekday",
      days: "Weekday",
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "weekend",
      label: "Weekend",
      days: "Weekend",
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: "anyday",
      label: "Anyday",
      days: "Anyday",
      color: "bg-green-100 text-green-700",
    },
  ];

  const LegendSection = () => {
    return (
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden border border-gray-200">
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setShowLegend(!showLegend)}
        >
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-white" />
            <h3 className="text-sm font-semibold text-white">
              Volunteer & Field Staff Quick Reference Guide
            </h3>
          </div>
          <button className="text-white hover:text-white/80">
            {showLegend ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>

        {showLegend && (
          <div className="p-6 space-y-6">
            {/* Campaign Positions Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <Users className="h-4 w-4 mr-1" /> Campaign Positions
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {campaignPositions.map((pos) => {
                  const Icon = pos.icon;
                  return (
                    <div
                      key={pos.id}
                      className={`${pos.bgColor} rounded-lg p-3 text-center hover:shadow-md transition-shadow group relative`}
                      title={pos.description}
                    >
                      <Icon className={`h-5 w-5 ${pos.color} mx-auto mb-1`} />
                      <span className="text-xs font-medium text-gray-700 truncate block">
                        {pos.label}
                      </span>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {pos.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How to Get Involved Section */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <Star className="h-4 w-4 mr-1" /> How to Get Involved
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {involvementOptions.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div
                      key={role.id}
                      className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <Icon className={`h-4 w-4 ${role.color} mx-auto mb-1`} />
                      <span className="text-xs text-gray-700">
                        {role.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Availability & Days Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Availability
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availabilityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.id}
                        className={`${opt.bgColor} rounded-lg p-2 text-center`}
                      >
                        <Icon className={`h-4 w-4 ${opt.color} mx-auto mb-1`} />
                        <span className="text-xs font-medium text-gray-700 block">
                          {opt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" /> Days Available
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {dayOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className={`${opt.color.split(" ")[0]} rounded-lg p-2 text-center`}
                    >
                      <span className="text-xs font-medium text-gray-700 block">
                        {opt.label}
                      </span>
                      <span className="text-xs text-gray-500">{opt.days}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Information Fields */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-1" /> Required Contact Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                <span className="bg-white px-2 py-1 rounded border">
                  First name
                </span>
                <span className="bg-white px-2 py-1 rounded border">
                  Last name
                </span>
                <span className="bg-white px-2 py-1 rounded border">Email</span>
                <span className="bg-white px-2 py-1 rounded border">
                  Telephone
                </span>
                <span className="bg-white px-2 py-1 rounded border">
                  Address
                </span>
                <span className="bg-white px-2 py-1 rounded border">City</span>
                <span className="bg-white px-2 py-1 rounded border">
                  State/Zip
                </span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Status Indicators
                </h4>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Active
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    Pending
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                    Inactive
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Agreement Status
                </h4>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" /> Fully Signed
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" /> Partial
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" /> Not Signed
                  </span>
                </div>
              </div>
            </div>

            {/* Field Staff Note */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-start">
                <DollarSign className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-purple-800">
                    Field Staff Requirements:
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    W9/1099 forms required • Hourly rate tracking • Staff
                    agreement required
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Note */}
            {isAdmin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Shield className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">
                      Admin Access: You have full management capabilities
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Add, edit, delete, promote, manage passwords, update W9
                      forms, and manage access levels
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Volunteers & Field Staff
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage campaign workforce
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-40">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Types</option>
              <option value="volunteer">Volunteers</option>
              <option value="field_staff">Field Staff</option>
            </select>
          </div>
          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </button>
          ) : (
            <button
              className="btn-secondary inline-flex items-center opacity-50 cursor-not-allowed w-full sm:w-auto justify-center"
              title="Admin access required"
              disabled
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </button>
          )}
        </div>
      </div>

      {/* Admin Mode Banner */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <UserCog className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Admin Mode</p>
              <p className="text-sm text-blue-700 mt-1">
                You can manage volunteers, field staff, passwords, and system
                access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend Section */}
      <LegendSection />

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex space-x-3">
            <button className="btn-secondary inline-flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary inline-flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Agreement Modal */}
      <AgreementModal
        isOpen={showAgreementModal}
        onClose={() => {
          setShowAgreementModal(false);
          setAgreementUser(null);
        }}
        user={agreementUser}
        currentUser={user}
        onAgreementSigned={() => {
          fetchVolunteers();
        }}
      />

      {/* Loading State */}
      {loading ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 text-sm">Loading volunteers...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preferred
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {volunteers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Users className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-gray-600 text-sm">
                            No volunteers found
                          </p>
                          {searchTerm && (
                            <p className="text-gray-500 text-xs mt-2">
                              Try adjusting your search terms
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    volunteers.map((person) => (
                      <tr
                        key={person._id || person.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetails(person)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {getInitials(
                                    person.firstName,
                                    person.lastName,
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {person.firstName} {person.lastName}
                                {renderAgreementStatus(person)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Joined: {formatDate(person.joinDate)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              person.role === "field_staff"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {person.role === "field_staff"
                              ? "Field Staff"
                              : "Volunteer"}
                          </span>
                          {person.hourlyRate && (
                            <div className="text-xs text-gray-600 mt-1">
                              ${person.hourlyRate}/hr
                            </div>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {person.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {person.phone || "No phone"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {person.hours || 0} hours
                          </div>
                          <div className="text-xs text-gray-500">
                            {person.assignedTo?.length || 0} assignments
                          </div>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {person.availability === "morning" && (
                              <>
                                <Sun className="h-4 w-4 text-amber-500 mr-1" />
                                <span className="text-sm">Morning</span>
                              </>
                            )}
                            {person.availability === "afternoon" && (
                              <>
                                <SunDim className="h-4 w-4 text-orange-500 mr-1" />
                                <span className="text-sm">Afternoon</span>
                              </>
                            )}
                            {person.availability === "evening" && (
                              <>
                                <Moon className="h-4 w-4 text-indigo-500 mr-1" />
                                <span className="text-sm">Evening</span>
                              </>
                            )}
                            {person.availability === "any" && (
                              <>
                                <Clock className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm">Flexible</span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {person.preferredDays === "weekday" && "Weekdays"}
                            {person.preferredDays === "weekend" && "Weekends"}
                            {person.preferredDays === "anyday" && "Any Day"}
                          </div>
                        </td>
                        <td className="hidden xl:table-cell px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {person.preferredRoles
                              ?.slice(0, 2)
                              .map((role, idx) => {
                                const roleIcon = {
                                  canvass: (
                                    <Home className="h-3 w-3 text-blue-600" />
                                  ),
                                  phone_banking: (
                                    <Phone className="h-3 w-3 text-purple-600" />
                                  ),
                                  fundraiser: (
                                    <DollarSign className="h-3 w-3 text-emerald-600" />
                                  ),
                                  postcard: (
                                    <Mail className="h-3 w-3 text-amber-600" />
                                  ),
                                  letter: (
                                    <FileSignature className="h-3 w-3 text-cyan-600" />
                                  ),
                                  other: (
                                    <Star className="h-3 w-3 text-gray-600" />
                                  ),
                                };
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                    title={role.replace(/_/g, " ")}
                                  >
                                    {roleIcon[role]}
                                    <span className="ml-1 capitalize">
                                      {role === "canvass"
                                        ? "Canvass"
                                        : role === "phone_banking"
                                          ? "Phone"
                                          : role === "fundraiser"
                                            ? "Fund"
                                            : role === "postcard"
                                              ? "Post"
                                              : role === "letter"
                                                ? "Letter"
                                                : role}
                                    </span>
                                  </span>
                                );
                              })}
                            {(person.preferredRoles?.length || 0) > 2 && (
                              <span className="text-xs text-gray-500">
                                +{person.preferredRoles.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className="px-4 py-4 whitespace-nowrap text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isAdmin
                            ? renderAdminActions(person)
                            : renderUserActions(person)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {volunteers.length > 0 && <PaginationControls />}
          </div>
        </>
      )}

      {/* View Volunteer Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={
          selectedVolunteer
            ? `${selectedVolunteer.firstName} ${selectedVolunteer.lastName}`
            : ""
        }
        size="2xl"
        showFooter={false}
      >
        {selectedVolunteer && (
          <div className="space-y-6">
            {/* Header with basic info */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xl">
                    {getInitials(
                      selectedVolunteer.firstName,
                      selectedVolunteer.lastName,
                    )}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedVolunteer.firstName} {selectedVolunteer.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedVolunteer.role === "field_staff"
                        ? "Field Staff"
                        : "Volunteer"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedVolunteer.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedVolunteer.status || "active"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joined: {formatDate(selectedVolunteer.joinDate)}
                  </div>
                  {selectedVolunteer.dateOfBirth && (
                    <div className="flex items-center text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      DOB: {formatDate(selectedVolunteer.dateOfBirth)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">
                      {selectedVolunteer.email}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">
                      {selectedVolunteer.phone || "Not provided"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">
                      {selectedVolunteer.location || "Not specified"}
                    </span>
                  </div>
                  {selectedVolunteer.hourlyRate && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-900">
                        ${selectedVolunteer.hourlyRate}/hour
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Full Address */}
            {(selectedVolunteer.address ||
              selectedVolunteer.city ||
              selectedVolunteer.state ||
              selectedVolunteer.zip) && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2 text-blue-600" />
                  Full Address
                </h4>
                <p className="text-sm text-gray-700">
                  {selectedVolunteer.address && (
                    <span>
                      {selectedVolunteer.address}
                      <br />
                    </span>
                  )}
                  {selectedVolunteer.city &&
                  selectedVolunteer.state &&
                  selectedVolunteer.zip ? (
                    <span>
                      {selectedVolunteer.city}, {selectedVolunteer.state}{" "}
                      {selectedVolunteer.zip}
                    </span>
                  ) : (
                    <span>
                      {selectedVolunteer.city} {selectedVolunteer.state}{" "}
                      {selectedVolunteer.zip}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Preferences Section */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Star className="h-4 w-4 mr-2 text-green-600" />
                Volunteer Preferences
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Availability</p>
                  <div className="flex items-center mt-1">
                    {selectedVolunteer.availability === "morning" && (
                      <>
                        <Sun className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm text-gray-900">Morning</span>
                      </>
                    )}
                    {selectedVolunteer.availability === "afternoon" && (
                      <>
                        <SunDim className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-900">Afternoon</span>
                      </>
                    )}
                    {selectedVolunteer.availability === "evening" && (
                      <>
                        <Moon className="h-4 w-4 text-indigo-500 mr-2" />
                        <span className="text-sm text-gray-900">Evening</span>
                      </>
                    )}
                    {selectedVolunteer.availability === "any" && (
                      <>
                        <Clock className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">Flexible</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Days</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 capitalize">
                      {selectedVolunteer.preferredDays === "weekday" &&
                        "Weekdays"}
                      {selectedVolunteer.preferredDays === "weekend" &&
                        "Weekends"}
                      {selectedVolunteer.preferredDays === "anyday" &&
                        "Any Day"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Preferred Roles</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedVolunteer.preferredRoles?.map((role, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                      >
                        {role.replace(/_/g, " ")}
                      </span>
                    ))}
                    {(!selectedVolunteer.preferredRoles ||
                      selectedVolunteer.preferredRoles.length === 0) && (
                      <span className="text-sm text-gray-500">
                        None specified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Hours & Assignments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">
                    Hours Worked
                  </h4>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedVolunteer.hours || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total hours</p>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleAddHours(selectedVolunteer);
                      }}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Hours
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Activity className="h-5 w-5 text-green-500 mr-2" />
                  <h4 className="text-sm font-medium text-gray-900">
                    Assignments
                  </h4>
                </div>
                <div className="space-y-2">
                  {selectedVolunteer.assignedTo?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedVolunteer.assignedTo.map((task, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200"
                        >
                          {task.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 italic">
                      No assignments yet
                    </p>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleUpdateAssignments(selectedVolunteer);
                      }}
                      className="mt-2 text-green-600 hover:text-green-800 text-sm font-medium inline-flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Update Assignments
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Agreements Section */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 text-indigo-500 mr-2" />
                <h4 className="text-sm font-medium text-gray-900">
                  Required Agreements
                </h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Status:</span>
                  <span
                    className={`text-sm font-medium ${
                      getAgreementStatus(selectedVolunteer) === "fully_signed"
                        ? "text-green-700"
                        : getAgreementStatus(selectedVolunteer) ===
                            "partially_signed"
                          ? "text-yellow-700"
                          : "text-red-700"
                    }`}
                  >
                    {getAgreementStatus(selectedVolunteer) === "fully_signed"
                      ? "Fully Signed ✓"
                      : getAgreementStatus(selectedVolunteer) ===
                          "partially_signed"
                        ? "Partially Signed"
                        : "Not Signed"}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  <p className="font-medium">
                    Required for {selectedVolunteer?.role}:
                  </p>
                  <ul className="mt-1 list-disc list-inside">
                    {getRequiredAgreementsForRole(selectedVolunteer?.role).map(
                      (type) => (
                        <li key={type}>
                          {type === "volunteer"
                            ? "Volunteer Agreement"
                            : type === "staffer"
                              ? "Staff Agreement"
                              : "Contractor Agreement"}
                          {selectedVolunteer?.agreements[type]?.agreed && (
                            <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleViewAgreements(selectedVolunteer);
                  }}
                  className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  View/Manage Agreements
                </button>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Access Level</p>
                  <p className="text-sm text-gray-900">
                    {selectedVolunteer.role === "field_staff"
                      ? "Field Staff"
                      : selectedVolunteer.role === "admin"
                        ? "Admin"
                        : "Volunteer"}
                  </p>
                </div>
                {selectedVolunteer.role === "field_staff" && (
                  <div>
                    <p className="text-xs text-gray-500">W9/1099 Status</p>
                    <div className="flex items-center">
                      {selectedVolunteer.w9Form ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm text-green-700">
                            Submitted: {selectedVolunteer.w9Form}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                          <span className="text-sm text-amber-700">
                            Required
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Admin Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditVolunteer(selectedVolunteer);
                    }}
                    className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium rounded-md inline-flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                  {selectedVolunteer.role === "volunteer" && (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handlePromoteToStaff(selectedVolunteer);
                      }}
                      className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-sm font-medium rounded-md inline-flex items-center"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Promote to Staff
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleManageAccess(selectedVolunteer);
                    }}
                    className="px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium rounded-md inline-flex items-center"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Manage Access
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleChangePassword(selectedVolunteer);
                    }}
                    className="px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-sm font-medium rounded-md inline-flex items-center"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleResetPassword(selectedVolunteer);
                    }}
                    className="px-3 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 text-sm font-medium rounded-md inline-flex items-center"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Reset Password
                  </button>
                  {selectedVolunteer.role === "field_staff" &&
                    !selectedVolunteer.w9Form && (
                      <button
                        onClick={() => {
                          setShowViewModal(false);
                          handleUpdateW9(selectedVolunteer);
                        }}
                        className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium rounded-md inline-flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Update W9
                      </button>
                    )}
                  {selectedVolunteer._id !== user?.id && (
                    <button
                      onClick={() => handleDeleteVolunteer(selectedVolunteer)}
                      className="px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium rounded-md inline-flex items-center"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Volunteer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add New Volunteer/Staff"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleAddVolunteer}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={volunteerForm.firstName}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      firstName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={volunteerForm.lastName}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      lastName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={volunteerForm.email}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={volunteerForm.phone}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Full Address Fields */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Address Information
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={volunteerForm.address}
                    onChange={(e) =>
                      setVolunteerForm({
                        ...volunteerForm,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={volunteerForm.city}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={volunteerForm.state}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      maxLength="2"
                      placeholder="CA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={volunteerForm.zip}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          zip: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={volunteerForm.dateOfBirth}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={volunteerForm.type}
                  onChange={(e) =>
                    setVolunteerForm({ ...volunteerForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="field_staff">Field Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (City, State)
              </label>
              <input
                type="text"
                value={volunteerForm.location}
                onChange={(e) =>
                  setVolunteerForm({
                    ...volunteerForm,
                    location: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="City, State"
              />
            </div>

            {volunteerForm.type === "field_staff" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={volunteerForm.hourlyRate}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      hourlyRate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Availability Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Availability
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time of Day
                  </label>
                  <select
                    value={volunteerForm.availability}
                    onChange={(e) =>
                      setVolunteerForm({
                        ...volunteerForm,
                        availability: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="any">Any</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days
                  </label>
                  <select
                    value={volunteerForm.days}
                    onChange={(e) =>
                      setVolunteerForm({
                        ...volunteerForm,
                        days: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekday">Weekday</option>
                    <option value="weekend">Weekend</option>
                    <option value="anyday">Anyday</option>
                  </select>
                </div>
              </div>
            </div>

            {/* How to Get Involved */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you like to get involved?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {involvementOptions.map((option) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`role-${option.id}`}
                      checked={volunteerForm.preferredRoles.includes(option.id)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...volunteerForm.preferredRoles, option.id]
                          : volunteerForm.preferredRoles.filter(
                              (r) => r !== option.id,
                            );
                        setVolunteerForm({
                          ...volunteerForm,
                          preferredRoles: newRoles,
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`role-${option.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignments
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {assignmentOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`assign-${option}`}
                      checked={volunteerForm.assignedTo.includes(option)}
                      onChange={(e) => {
                        const newAssignments = e.target.checked
                          ? [...volunteerForm.assignedTo, option]
                          : volunteerForm.assignedTo.filter(
                              (a) => a !== option,
                            );
                        setVolunteerForm({
                          ...volunteerForm,
                          assignedTo: newAssignments,
                        });
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`assign-${option}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Account Setup
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={volunteerForm.password}
                      onChange={(e) =>
                        setVolunteerForm({
                          ...volunteerForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                      minLength="8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={volunteerForm.confirmPassword}
                    onChange={(e) =>
                      setVolunteerForm({
                        ...volunteerForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Level *
                  </label>
                  <select
                    value={volunteerForm.accessLevel}
                    onChange={(e) =>
                      setVolunteerForm({
                        ...volunteerForm,
                        accessLevel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="volunteer">Volunteer (Read-only)</option>
                    <option value="field_staff">
                      Field Staff (Limited Access)
                    </option>
                    <option value="manager">Manager (Full Access)</option>
                    <option value="admin">Admin (Full System Access)</option>
                  </select>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Key className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        A welcome email with login instructions will be sent to
                        the user&apos;s email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Volunteer Modal - similar updates would go here */}
      {/* Additional modals would follow the same pattern */}

      {/* Add Hours Modal */}
      <Modal
        isOpen={showHoursModal}
        onClose={() => setShowHoursModal(false)}
        title={`Add Hours for ${selectedVolunteer?.firstName} ${selectedVolunteer?.lastName}`}
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleSubmitHours}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours *
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={hoursData.hours}
                onChange={(e) =>
                  setHoursData({ ...hoursData, hours: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter hours"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={hoursData.date}
                onChange={(e) =>
                  setHoursData({ ...hoursData, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity
              </label>
              <input
                type="text"
                value={hoursData.activity}
                onChange={(e) =>
                  setHoursData({ ...hoursData, activity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Canvassing, Phone Banking"
              />
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Current total hours:{" "}
                    <strong>{selectedVolunteer?.hours || 0}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Update W9 Modal */}
      <Modal
        isOpen={showW9Modal}
        onClose={() => setShowW9Modal(false)}
        title={`Update W9 Form for ${selectedVolunteer?.firstName} ${selectedVolunteer?.lastName}`}
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleSubmitW9}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                W9 Form Reference *
              </label>
              <input
                type="text"
                required
                value={w9FormData.w9Form}
                onChange={(e) =>
                  setW9FormData({ ...w9FormData, w9Form: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., W9-2024-001, Uploaded_2024-01-15"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the W9 form reference number or upload identifier
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submitted Date
              </label>
              <input
                type="date"
                value={w9FormData.submittedDate}
                onChange={(e) =>
                  setW9FormData({
                    ...w9FormData,
                    submittedDate: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    W9 forms are required for all field staff for tax purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Promote Modal */}
      <Modal
        isOpen={showPromoteModal}
        onClose={() => setShowPromoteModal(false)}
        title="Promote to Field Staff"
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleConfirmPromote}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Promote {selectedVolunteer?.firstName}{" "}
                {selectedVolunteer?.lastName}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to promote this volunteer to field staff?
                This action will:
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Require W9/1099 form submission
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Enable hourly rate tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Grant access to staff resources
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Add to payroll system
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This action cannot be undone. The person will need to
                    complete tax forms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Manage Access Modal */}
      <Modal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        title={`Manage System Access for ${selectedVolunteer?.firstName} ${selectedVolunteer?.lastName}`}
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleManageAccessSubmit}>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Managing access for:{" "}
                    <strong>{selectedVolunteer?.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Level *
              </label>
              <select
                value={volunteerForm.accessLevel}
                onChange={(e) =>
                  setVolunteerForm({
                    ...volunteerForm,
                    accessLevel: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="volunteer">Volunteer (Read-only)</option>
                <option value="field_staff">
                  Field Staff (Limited Access)
                </option>
                <option value="manager">Manager (Full Access)</option>
                <option value="admin">Admin (Full System Access)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Determines what the user can see and do in the system
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password (Optional)
              </label>
              <input
                type="password"
                value={volunteerForm.password}
                onChange={(e) =>
                  setVolunteerForm({
                    ...volunteerForm,
                    password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave blank to keep current password"
              />
              <p className="mt-1 text-xs text-gray-500">
                If provided, user will be prompted to change password on next
                login
              </p>
            </div>

            {volunteerForm.password && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required={!!volunteerForm.password}
                  value={volunteerForm.confirmPassword}
                  onChange={(e) =>
                    setVolunteerForm({
                      ...volunteerForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Changing access level will immediately update user
                    permissions. For security reasons, the user may be logged
                    out.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Update Assignments Modal */}
      <Modal
        isOpen={showAssignmentsModal}
        onClose={() => setShowAssignmentsModal(false)}
        title={`Update Assignments for ${selectedVolunteer?.firstName} ${selectedVolunteer?.lastName}`}
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleSubmitAssignments}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assignments
              </label>
              <div className="grid grid-cols-2 gap-2">
                {assignmentOptions.map((option) => (
                  <div key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`update-assign-${option}`}
                      checked={assignmentsData.includes(option)}
                      onChange={(e) => {
                        const newAssignments = e.target.checked
                          ? [...assignmentsData, option]
                          : assignmentsData.filter((a) => a !== option);
                        setAssignmentsData(newAssignments);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`update-assign-${option}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {option.replace("_", " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Assign volunteers to specific campaign activities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Volunteers;
