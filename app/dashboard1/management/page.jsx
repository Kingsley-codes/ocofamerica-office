// components/dashboard/ManagementDirectory.jsx
"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Edit,
  MoreVertical,
  Mail,
  Phone,
  CheckCircle,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  UserCog,
  Trash,
  FileText,
  Shield,
  Award,
  Briefcase,
} from "lucide-react";
import { getInitials, generateStatusColor } from "@/lib/utils";
import { apiRequest, validateSession } from "@/lib/auth";
import {
  getRoleDisplayName,
  getDepartmentFromRole,
  PERMISSIONS,
} from "@/lib/permissions";
import { useSidebar } from "@/context/SidebarContext";
import { useRouter } from "next/navigation";
import Header from "@/components/dasboard1/Header";
import Modal from "@/components/ui/Modal";
import DepartmentKey from "@/components/dashboard/DepartmentKey";
import AgreementModal from "@/components/AgreementModal";

export default function ManagementDirectory() {
  const router = useRouter();
  const { setIsOpen } = useSidebar();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [agreementUser, setAgreementUser] = useState(null);
  const [canAddDeleteUsers, setCanAddDeleteUsers] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const sessionData = await validateSession();

        if (!sessionData.valid) {
          router.push("/login");
          return;
        }

        setUser(sessionData.user);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Role options based on the PDF
  const roleOptions = [
    // Executive / Leadership
    {
      value: "client_admin",
      label: "Administrator",
      group: "Executive Leadership",
    },
    { value: "candidate", label: "Candidate", group: "Executive Leadership" },
    {
      value: "campaign_manager",
      label: "Campaign Manager",
      group: "Executive Leadership",
    },
    {
      value: "deputy_campaign_manager",
      label: "Deputy Campaign Manager",
      group: "Executive Leadership",
    },
    {
      value: "campaign_chair",
      label: "Campaign Chair",
      group: "Executive Leadership",
    },
    {
      value: "chief_of_staff",
      label: "Chief of Staff",
      group: "Executive Leadership",
    },
    {
      value: "state_director",
      label: "State Director",
      group: "Executive Leadership",
    },
    {
      value: "regional_director",
      label: "Regional Director",
      group: "Executive Leadership",
    },
    {
      value: "field_director",
      label: "Field Director",
      group: "Executive Leadership",
    },
    {
      value: "compliance_officer",
      label: "Compliance Officer",
      group: "Executive Leadership",
    },
    {
      value: "senior_advisor",
      label: "Senior Advisor",
      group: "Executive Leadership",
    },

    // Oversight
    {
      value: "scheduler",
      label: "Scheduler / Event Coordinator",
      group: "Oversight",
    },
    { value: "legal", label: "Legal", group: "Oversight" },

    // Finance
    { value: "finance_director", label: "Finance Director", group: "Finance" },
    { value: "fundraiser", label: "Fundraiser", group: "Finance" },
    {
      value: "finance_assistant",
      label: "Finance Assistant",
      group: "Finance",
    },
    {
      value: "call_time_manager",
      label: "Call Time Manager",
      group: "Finance",
    },
    { value: "donor_researcher", label: "Donor Researcher", group: "Finance" },
    {
      value: "event_fundraising_coordinator",
      label: "Event Fundraising Coordinator",
      group: "Finance",
    },

    // Media & Communications
    {
      value: "media_director",
      label: "Media Director",
      group: "Media & Communications",
    },
    {
      value: "communications_director",
      label: "Communications Director",
      group: "Media & Communications",
    },
    {
      value: "press_secretary",
      label: "Press Secretary",
      group: "Media & Communications",
    },
    {
      value: "digital_director",
      label: "Digital Director",
      group: "Media & Communications",
    },
    {
      value: "social_media_manager",
      label: "Social Media Manager",
      group: "Media & Communications",
    },
    {
      value: "content_creator",
      label: "Content Creator",
      group: "Media & Communications",
    },
    {
      value: "graphic_designer",
      label: "Graphic Designer",
      group: "Media & Communications",
    },
    {
      value: "videographer",
      label: "Videographer / Photographer",
      group: "Media & Communications",
    },
    {
      value: "rapid_response_director",
      label: "Rapid Response Director",
      group: "Media & Communications",
    },
    {
      value: "speechwriter",
      label: "Speechwriter",
      group: "Media & Communications",
    },

    // Field Operations
    {
      value: "field_director_ops",
      label: "Field Director",
      group: "Field Operations",
    },
    {
      value: "deputy_field_director",
      label: "Deputy Field Director",
      group: "Field Operations",
    },
    {
      value: "regional_field_coordinator",
      label: "Regional Field Coordinator",
      group: "Field Operations",
    },
    {
      value: "precinct_captain",
      label: "Precinct Captain",
      group: "Field Operations",
    },
    {
      value: "data_director",
      label: "Data Director",
      group: "Field Operations",
    },
    {
      value: "voter_file_manager",
      label: "Voter File Manager",
      group: "Field Operations",
    },
    {
      value: "volunteer_coordinator",
      label: "Volunteer Coordinator",
      group: "Field Operations",
    },
    {
      value: "gotv_director",
      label: "GOTV Director",
      group: "Field Operations",
    },
    {
      value: "ballot_chase_director",
      label: "Ballot Chase Director",
      group: "Field Operations",
    },
    {
      value: "text_bank_team",
      label: "Text Bank Team",
      group: "Field Operations",
    },

    // Limited Access
    { value: "volunteer", label: "Volunteer", group: "Limited Access" },
    { value: "canvasser", label: "Canvasser", group: "Limited Access" },
    { value: "phone_banker", label: "Phone Banker", group: "Limited Access" },
  ];

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    department: "",
    reportsTo: "",
    role: "volunteer",
    password: "",
    confirmPassword: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [resetPasswordForm, setResetPasswordForm] = useState({
    sendEmail: true,
  });

  useEffect(() => {
    // Check if current user can add/delete users (Executive team only)
    if (user && user.role) {
      setCanAddDeleteUsers(PERMISSIONS.CAN_ADD_DELETE_USERS(user.role));
    }
    fetchUsers();
  }, [user]);

  // Check for required agreements
  // useEffect(() => {
  //   if (currentUser && users.length > 0) {
  //     const currentUserData = users.find((user) => user._id === currentUser.id);

  //     if (currentUserData) {
  //       const requiredAgreements = getRequiredAgreementsForRole(
  //         currentUserData.role,
  //       );
  //       const signedAgreements = requiredAgreements.filter(
  //         (type) => currentUserData.agreements?.[type]?.agreed,
  //       );

  //       if (signedAgreements.length < requiredAgreements.length) {
  //         if (
  //           !showAgreementModal &&
  //           !showAddModal &&
  //           !showEditModal &&
  //           !showPasswordModal &&
  //           !showResetModal
  //         ) {
  //           setAgreementUser(currentUserData);
  //           setShowAgreementModal(true);
  //         }
  //       }
  //     }
  //   }
  // }, [
  //   currentUser,
  //   users,
  //   showAgreementModal,
  //   showAddModal,
  //   showEditModal,
  //   showPasswordModal,
  //   showResetModal,
  // ]);

  // Check for required agreements
  useEffect(() => {
    if (user && users.length > 0) {
      const currentUserData = users.find((user) => user._id === user.id);

      if (currentUserData) {
        // Only show agreement modal for volunteers
        if (currentUserData.role === "volunteer") {
          const requiredAgreements = getRequiredAgreementsForRole(
            currentUserData.role,
          );
          const signedAgreements = requiredAgreements.filter(
            (type) => currentUserData.agreements?.[type]?.agreed,
          );

          if (signedAgreements.length < requiredAgreements.length) {
            if (
              !showAgreementModal &&
              !showAddModal &&
              !showEditModal &&
              !showPasswordModal &&
              !showResetModal
            ) {
              setAgreementUser(currentUserData);
              setShowAgreementModal(true);
            }
          }
        }
      }
    }
  }, [
    user,
    users,
    showAgreementModal,
    showAddModal,
    showEditModal,
    showPasswordModal,
    showResetModal,
  ]);

  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await apiRequest(`/users?page=${page}&limit=20`);
      if (response.success) {
        // Add department to each user based on role
        const usersWithDept = response.users.map((user) => ({
          ...user,
          department: getDepartmentFromRole(user.role),
        }));
        setUsers(usersWithDept);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(error.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!canAddDeleteUsers) {
      alert("Only Executive/Leadership team members can add new users.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/users", {
        method: "POST",
        body: formData,
      });

      if (response.success) {
        setShowAddModal(false);
        resetFormData();
        fetchUsers();
        alert("User added successfully!");
      }
    } catch (error) {
      console.error("Error adding person:", error);
      alert(error.message || "Failed to add person. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPerson = (person) => {
    if (!canAddDeleteUsers) {
      alert("Only Executive/Leadership team members can edit users.");
      return;
    }

    setSelectedPerson(person);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title || "",
      email: person.email,
      phone: person.phone || "",
      department: person.department || getDepartmentFromRole(person.role),
      reportsTo: person.reportsTo || "",
      role: person.role,
      password: "",
      confirmPassword: "",
    });
    setShowEditModal(true);
  };

  const handleUpdatePerson = async (e) => {
    e.preventDefault();
    if (!canAddDeleteUsers || !selectedPerson) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest(`/users/${selectedPerson._id}`, {
        method: "PUT",
        body: formData,
      });

      if (response.success) {
        setShowEditModal(false);
        resetFormData();
        setSelectedPerson(null);
        fetchUsers();
        alert("User updated successfully!");
      }
    } catch (error) {
      console.error("Error updating person:", error);
      alert(error.message || "Failed to update user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = (person) => {
    if (!canAddDeleteUsers) {
      alert("Only Executive/Leadership team members can change passwords.");
      return;
    }

    setSelectedPerson(person);
    setShowPasswordModal(true);
  };

  const handleResetPassword = (person) => {
    if (!canAddDeleteUsers) {
      alert("Only Executive/Leadership team members can reset passwords.");
      return;
    }

    setSelectedPerson(person);
    setShowResetModal(true);
  };

  const handleViewAgreements = async (person) => {
    try {
      if (user.id !== person._id && !canAddDeleteUsers) {
        alert("You can only view your own agreements.");
        return;
      }

      setAgreementUser(person);
      setShowAgreementModal(true);
    } catch (error) {
      console.error("Error viewing agreements:", error);
      alert("Failed to view agreements. Please try again.");
    }
  };

  const handleAgreementSigned = (updatedUser) => {
    if (updatedUser && updatedUser._id) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser._id ? updatedUser : user,
        ),
      );

      if (agreementUser && agreementUser._id === updatedUser._id) {
        setAgreementUser(updatedUser);
      }
    } else {
      fetchUsers();
    }
  };

  const handleDeleteUser = async (person) => {
    if (!canAddDeleteUsers) {
      alert("Only Executive/Leadership team members can delete users.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${person.firstName} ${person.lastName}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await apiRequest(`/users/${person._id}`, {
        method: "DELETE",
      });

      if (response.success) {
        fetchUsers();
        alert("User deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.message || "Failed to delete user.");
    }
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    if (!canAddDeleteUsers) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert("New password must be at least 8 characters long!");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/auth/change-password", {
        method: "POST",
        body: passwordForm,
      });

      if (response.success) {
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        alert("Password changed successfully!");
      } else {
        alert(response.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert(error.message || "Failed to change password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPasswordReset = async (e) => {
    e.preventDefault();
    if (!canAddDeleteUsers || !selectedPerson) return;

    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        `/users/${selectedPerson._id}/reset-password`,
        {
          method: "POST",
          body: resetPasswordForm,
        },
      );

      if (response.success) {
        setShowResetModal(false);
        setResetPasswordForm({ sendEmail: true });
        alert("Password reset initiated successfully!");
        if (response.newPassword) {
          alert(`New temporary password: ${response.newPassword}`);
        }
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone: "",
      department: "",
      reportsTo: "",
      role: "volunteer",
      password: "",
      confirmPassword: "",
    });
  };

  // Helper function to get required agreements for each role
  // const getRequiredAgreementsForRole = (role) => {
  //   const executiveRoles = [
  //     "admin",
  //     "candidate",
  //     "campaign_manager",
  //     "deputy_campaign_manager",
  //     "campaign_chair",
  //     "chief_of_staff",
  //     "state_director",
  //     "regional_director",
  //     "field_director",
  //     "compliance_officer",
  //     "senior_advisor",
  //   ];

  //   if (executiveRoles.includes(role)) {
  //     return ["staffer", "contractor"];
  //   }

  //   switch (role) {
  //     case "field_director_ops":
  //     case "deputy_field_director":
  //       return ["staffer", "contractor"];
  //     case "volunteer":
  //     case "canvasser":
  //     case "phone_banker":
  //       return ["volunteer"];
  //     case "manager":
  //     case "finance_director":
  //     case "media_director":
  //     case "communications_director":
  //     case "legal":
  //     case "scheduler":
  //       return ["volunteer"];
  //     default:
  //       return [];
  //   }
  // };

  // Helper function to get required agreements for each role
  const getRequiredAgreementsForRole = (role) => {
    // Only volunteers need agreements for now
    if (role === "volunteer") {
      return ["volunteer"];
    }

    // All other roles don't need agreements
    return [];
  };

  // Check agreement status for a user
  const getAgreementStatus = (person) => {
    if (!person.agreements) return "not_signed";

    const requiredAgreements = getRequiredAgreementsForRole(person.role);

    if (requiredAgreements.length === 0) return "not_required";

    const signedAgreements = requiredAgreements.filter(
      (type) => person.agreements[type]?.agreed,
    );

    if (signedAgreements.length === requiredAgreements.length) {
      return "fully_signed";
    } else if (signedAgreements.length > 0) {
      return "partially_signed";
    }
    return "not_signed";
  };

  // Check agreement status for a user
  // const getAgreementStatus = (person) => {
  //   if (!person.agreements) return "not_signed";

  //   const requiredAgreements = getRequiredAgreementsForRole(person.role);

  //   if (requiredAgreements.length === 0) return "not_required";

  //   const signedAgreements = requiredAgreements.filter(
  //     (type) => person.agreements[type]?.agreed,
  //   );

  //   if (signedAgreements.length === requiredAgreements.length) {
  //     return "fully_signed";
  //   } else if (signedAgreements.length > 0) {
  //     return "partially_signed";
  //   }
  //   return "not_signed";
  // };

  const renderAgreementStatus = (person) => {
    const status = getAgreementStatus(person);

    if (status === "not_required") {
      return null;
    }

    const colors = {
      fully_signed: "bg-green-100 text-green-800",
      partially_signed: "bg-yellow-100 text-yellow-800",
      not_signed: "bg-red-100 text-red-800",
    };

    const labels = {
      fully_signed: "Agreements Signed",
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

  const renderAdminActions = (person) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEditPerson(person)}
        className="text-blue-600 hover:text-blue-900"
        title="Edit User"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleViewAgreements(person)}
        className="text-indigo-600 hover:text-indigo-900"
        title="View Agreements"
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleChangePassword(person)}
        className="text-green-600 hover:text-green-900"
        title="Change Password"
      >
        <Key className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleResetPassword(person)}
        className="text-amber-600 hover:text-amber-900"
        title="Reset Password"
      >
        <Lock className="h-4 w-4" />
      </button>
      {person._id !== user?.id && (
        <button
          onClick={() => handleDeleteUser(person)}
          className="text-red-600 hover:text-red-900"
          title="Delete User"
        >
          <Trash className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const renderUserActions = (person) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleViewAgreements(person)}
        className="text-indigo-600 hover:text-indigo-900"
        title="View Agreements"
      >
        <FileText className="h-4 w-4" />
      </button>
      <button
        className="text-gray-300 cursor-not-allowed"
        title="Executive access required"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        className="text-gray-300 cursor-not-allowed"
        title="Executive access required"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );

  // Get role badge color based on department
  const getRoleBadgeColor = (role) => {
    const executiveRoles = [
      "client_admin",
      "candidate",
      "campaign_manager",
      "deputy_campaign_manager",
      "campaign_chair",
      "chief_of_staff",
      "state_director",
      "regional_director",
      "field_director",
      "compliance_officer",
      "senior_advisor",
    ];

    if (executiveRoles.includes(role)) return "bg-purple-100 text-purple-800";
    if (["scheduler", "legal"].includes(role))
      return "bg-blue-100 text-blue-800";
    if (role.includes("finance") || role.includes("fundraiser"))
      return "bg-green-100 text-green-800";
    if (
      role.includes("media") ||
      role.includes("communications") ||
      role.includes("press")
    )
      return "bg-pink-100 text-pink-800";
    if (
      role.includes("field") ||
      role.includes("data") ||
      role.includes("voter")
    )
      return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header setIsOpen={setIsOpen} />

      {/* Department Key / Legend */}
      <DepartmentKey />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Management Directory
          </h3>
          <p className="text-sm text-gray-600">
            Key People with Campaign Access - Everyone can view contact
            information
          </p>
        </div>
        {canAddDeleteUsers ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </button>
        ) : (
          <button
            className="btn-secondary inline-flex items-center opacity-50 cursor-not-allowed"
            title="Executive team only"
            disabled
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </button>
        )}
      </div>

      {canAddDeleteUsers && (
        <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Award className="h-5 w-5 text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700">
                <strong>Executive Access:</strong> You have full access to
                manage users, passwords, and permissions as a member of the
                Executive/Leadership Team.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table with Overflow */}
      <div className="bg-white shadow w-full overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Title / Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                  Reports To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((person) => (
                <tr key={person._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {getInitials(person.firstName, person.lastName)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {person.firstName} {person.lastName}
                          {renderAgreementStatus(person)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[180px]">
                    <div className="text-sm text-gray-900">
                      {person.title || getRoleDisplayName(person.role)}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium ${getRoleBadgeColor(person.role)}`}
                    >
                      {getRoleDisplayName(person.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[150px]">
                    <span className="text-sm text-gray-900">
                      {person.department || getDepartmentFromRole(person.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[150px]">
                    {person.reportsTo || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 min-w-[180px]">
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {person.phone || "-"}
                    </div>
                    <div className="flex items-center mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="text-xs">{person.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium min-w-[120px]">
                    {canAddDeleteUsers
                      ? renderAdminActions(person)
                      : renderUserActions(person)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{users.length}</span> of{" "}
                <span className="font-medium">{pagination.total}</span> users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
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
        onAgreementSigned={handleAgreementSigned}
      />

      {/* Add Person Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
        title="Add New Person"
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleAddPerson}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
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
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Field Director"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: selectedRole,
                      department: getDepartmentFromRole(selectedRole),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <optgroup label="Executive / Leadership">
                    {roleOptions
                      .filter((r) => r.group === "Executive Leadership")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Oversight">
                    {roleOptions
                      .filter((r) => r.group === "Oversight")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Finance">
                    {roleOptions
                      .filter((r) => r.group === "Finance")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Media & Communications">
                    {roleOptions
                      .filter((r) => r.group === "Media & Communications")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Field Operations">
                    {roleOptions
                      .filter((r) => r.group === "Field Operations")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Limited Access">
                    {roleOptions
                      .filter((r) => r.group === "Limited Access")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department (Auto-set by Role)
                </label>
                <input
                  type="text"
                  value={getDepartmentFromRole(formData.role)}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reports To
                </label>
                <input
                  type="text"
                  value={formData.reportsTo}
                  onChange={(e) =>
                    setFormData({ ...formData, reportsTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Campaign Manager"
                />
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
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
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
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

      {/* Edit Person Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetFormData();
          setSelectedPerson(null);
        }}
        title={`Edit ${selectedPerson?.firstName} ${selectedPerson?.lastName}`}
        size="lg"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleUpdatePerson}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
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
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setFormData({
                      ...formData,
                      role: selectedRole,
                      department: getDepartmentFromRole(selectedRole),
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <optgroup label="Executive / Leadership">
                    {roleOptions
                      .filter((r) => r.group === "Executive Leadership")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Oversight">
                    {roleOptions
                      .filter((r) => r.group === "Oversight")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Finance">
                    {roleOptions
                      .filter((r) => r.group === "Finance")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Media & Communications">
                    {roleOptions
                      .filter((r) => r.group === "Media & Communications")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Field Operations">
                    {roleOptions
                      .filter((r) => r.group === "Field Operations")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Limited Access">
                    {roleOptions
                      .filter((r) => r.group === "Limited Access")
                      .map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reports To
                </label>
                <input
                  type="text"
                  value={formData.reportsTo}
                  onChange={(e) =>
                    setFormData({ ...formData, reportsTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Campaign Manager"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Changes will be saved immediately. For password changes, use
                    the &ldquo;Change Password&rdquo; option.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleSubmitPasswordChange}>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Key className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Changing password for {selectedPerson?.firstName}{" "}
                    {selectedPerson?.lastName}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                minLength="8"
              />
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
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
                    The user will need to log in with their new password
                    immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={`Reset Password for ${selectedPerson?.firstName} ${selectedPerson?.lastName}`}
        size="md"
        isSubmitting={isSubmitting}
      >
        <form id="modal-form" onSubmit={handleSubmitPasswordReset}>
          <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Reset password for: <strong>{selectedPerson?.email}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={resetPasswordForm.sendEmail}
                    onChange={() =>
                      setResetPasswordForm({
                        sendEmail: true,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-700">
                    Send Password Reset Email
                  </label>
                  <p className="text-gray-500">
                    User will receive an email with a link to reset their
                    password
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={!resetPasswordForm.sendEmail}
                    onChange={() =>
                      setResetPasswordForm({
                        sendEmail: false,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-700">
                    Generate Temporary Password
                  </label>
                  <p className="text-gray-500">
                    Create a temporary password that the user must change on
                    first login
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Warning:</strong> This will immediately invalidate
                    the user&apos;s current password. The user will be logged
                    out from all devices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
