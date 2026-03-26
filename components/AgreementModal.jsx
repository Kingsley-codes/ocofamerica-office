/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Download,
  Printer,
  FileText,
  CheckCircle,
  AlertCircle,
  Signature,
  Upload,
  UserCog,
  Shield,
  Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";

const AgreementModal = ({
  isOpen,
  onClose,
  user,
  currentUser,
  onAgreementSigned,
}) => {
  const [activeAgreement, setActiveAgreement] = useState("staffer");
  const [signature, setSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const fileInputRef = useRef(null);

  // Check if current user can view agreements
  const canViewAgreements = () => {
    if (!currentUser || !user) return false;
    return currentUser.id === user._id || currentUser.role === "admin";
  };

  // Check if current user can sign agreements
  const canSignAgreements = () => {
    if (!currentUser || !user) return false;
    return currentUser.id === user._id;
  };

  // Get required agreements based on user role
  // const getRequiredAgreements = () => {
  //   if (!user?.role) return [];

  //   switch (user.role) {
  //     case "admin":
  //       return ["staffer", "contractor"];
  //     case "field_staff":
  //       return ["staffer", "contractor"];
  //     case "volunteer":
  //       return ["volunteer"];
  //     case "manager":
  //     case "finance":
  //     case "field":
  //     case "media":
  //     case "legal":
  //     case "candidate":
  //       return ["staffer"];
  //     default:
  //       return ["volunteer"];
  //   }
  // };

  // Get required agreements based on user role
  const getRequiredAgreements = () => {
    if (!user?.role) return [];

    // Only volunteers need to sign agreements for now
    if (user.role === "volunteer") {
      return ["volunteer"];
    }

    // All other roles don't need agreements
    return [];
  };

  // Initialize canvas - SIMPLIFIED VERSION
  useEffect(() => {
    if (showSignaturePad && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();

      // Set canvas size to match display size
      canvas.width = rect.width;
      canvas.height = rect.height;

      const ctx = canvas.getContext("2d");
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
      setContext(ctx);

      // Clear canvas with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [showSignaturePad]);

  // Load existing signature if available
  useEffect(() => {
    if (user?.agreements?.[activeAgreement]?.signature) {
      setSignature(user.agreements[activeAgreement].signature);
    } else {
      setSignature("");
      setUploadedImage(null);
    }
  }, [user, activeAgreement]);

  const requiredAgreements = getRequiredAgreements();

  // Set default active agreement
  useEffect(() => {
    if (
      requiredAgreements.length > 0 &&
      !requiredAgreements.includes(activeAgreement)
    ) {
      setActiveAgreement(requiredAgreements[0]);
    }
  }, [requiredAgreements, activeAgreement]);

  // Get agreement status
  const getAgreementStatus = (type) => {
    return user?.agreements?.[type]?.agreed ? "signed" : "pending";
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "field_staff":
        return "Field Staff";
      case "volunteer":
        return "Volunteer";
      case "manager":
        return "Manager";
      case "finance":
        return "Finance";
      case "field":
        return "Field Operations";
      case "media":
        return "Media";
      case "legal":
        return "Legal";
      case "candidate":
        return "Candidate";
      default:
        return role;
    }
  };

  // Get agreement display info
  const getAgreementDisplayInfo = (type) => {
    switch (type) {
      case "volunteer":
        return {
          title: "CAMPAIGN VOLUNTEER AGREEMENT",
          icon: Shield,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case "staffer":
        return {
          title: "CAMPAIGN STAFFER AGREEMENT",
          icon: Briefcase,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        };
      case "contractor":
        return {
          title: "INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT",
          icon: FileText,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      default:
        return {
          title: "AGREEMENT",
          icon: FileText,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
    }
  };

  // Get agreement templates
  const getAgreementTemplate = (type) => {
    const displayInfo = getAgreementDisplayInfo(type);

    const baseContent = {
      volunteer: `CAMPAIGN VOLUNTEER AGREEMENT
This Campaign Volunteer Agreement ("Agreement") is entered into voluntarily by ${user?.firstName} ${user?.lastName} ("Volunteer") and Campaign ("Campaign").

1. Voluntary Service and No Compensation
I, ${user?.firstName} ${user?.lastName}, voluntarily agree to provide services to the Campaign as a volunteer. I understand and acknowledge that my services are provided freely and without expectation of wages, salary, benefits, or any other form of compensation. I further understand that this Agreement does not create an employment relationship between myself and the Campaign.

2. Assumption of Risk
I understand that volunteering for the Campaign may involve activities that carry inherent risks, including but not limited to physical activity, travel, interaction with the public, and exposure to unforeseen hazards. I knowingly and voluntarily assume full responsibility for any and all risks of injury, illness, property damage, or loss that may arise from my participation in Campaign activities, whether foreseen or unforeseen.

3. Release and Waiver of Liability
To the fullest extent permitted by law, I hereby release, waive, and discharge the Campaign, its officers, staff, volunteers, agents, and affiliates from any and all claims, liabilities, demands, actions, or causes of action arising out of or related to my volunteer activities, including but not limited to personal injury, property damage, or other losses, except where prohibited by law.

4. Compliance With Laws and Conduct
I agree to conduct myself in a professional, lawful, and respectful manner while representing or volunteering for the Campaign. I agree to comply with all applicable federal, state, and local laws, regulations, and Campaign policies. I understand that the Campaign may terminate my volunteer participation at any time, with or without cause.

5. Governing Law and Severability
This Agreement shall be governed by and interpreted in accordance with the laws of the United States and the applicable laws of the state in which the volunteer activity occurs. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

Volunteer Signature: ${user?.agreements?.volunteer?.signature ? "[SIGNED]" : "___________________________"}

Printed Name: ${user?.firstName} ${user?.lastName}

Date: ${user?.agreements?.volunteer?.signedAt ? new Date(user.agreements.volunteer.signedAt).toLocaleDateString() : "___________________________"}`,

      staffer: `CAMPAIGN STAFFER AGREEMENT
This Campaign Staffer Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user?.firstName} ${user?.lastName} ("Staffer").

1. Engagement and Compensation
The Campaign engages the Staffer to perform services related to campaign activities. The Staffer understands and agrees that they will be compensated as agreed separately by the Campaign, but that nothing in this Agreement shall be construed to create a partnership, joint venture, or entitlement to benefits beyond agreed compensation. The Staffer acknowledges that they are responsible for all applicable taxes, insurance, and personal expenses unless otherwise required by law.

2. Assumption of Risk
The Staffer understands that campaign work may involve physical activity, travel, public interaction, long hours, and other inherent risks. The Staffer knowingly and voluntarily assumes full responsibility for any and all risks of injury, illness, death, property damage, or loss arising out of or related to their work for the Campaign, whether such risks are known or unknown, foreseen or unforeseen.

3. Insurance Requirements
The Staffer represents and warrants that they maintain, at their own expense, valid and adequate health insurance coverage and, where applicable, general liability insurance sufficient to cover claims arising from their activities. The Campaign does not provide health insurance, workers' compensation, or liability insurance for the Staffer unless required by applicable law. The Staffer agrees to provide proof of insurance upon request.

4. Release and Waiver of Liability
To the fullest extent permitted by law, the Staffer hereby releases, waives, and discharges the Campaign, its officers, employees, volunteers, agents, and affiliates from any and all claims, liabilities, demands, damages, or causes of action arising out of or related to the Staffer's work for the Campaign, including but not limited to personal injury, illness, or property damage, except where prohibited by law.

5. Compliance, Conduct, and Termination
The Staffer agrees to comply with all applicable federal, state, and local laws, regulations, and Campaign policies. The Staffer agrees to conduct themselves in a professional and lawful manner at all times. The Campaign reserves the right to terminate this Agreement at any time, with or without cause, subject to applicable law.

6. Governing Law and Severability
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

Staffer Signature: ${user?.agreements?.staffer?.signature ? "[SIGNED]" : "___________________________"}

Printed Name: ${user?.firstName} ${user?.lastName}

Date: ${user?.agreements?.staffer?.signedAt ? new Date(user.agreements.staffer.signedAt).toLocaleDateString() : "___________________________"}`,

      contractor: `INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT
This Independent Contractor Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user?.firstName} ${user?.lastName} ("Contractor").

1. Independent Contractor Status
The Contractor is engaged by the Campaign as an independent contractor and not as an employee. Nothing in this Agreement shall be construed to create an employer-employee relationship, partnership, joint venture, or agency relationship. The Contractor is not entitled to any employee benefits, including but not limited to health insurance, workers' compensation, unemployment insurance, or retirement benefits.

2. Services and Compensation
The Contractor agrees to provide campaign-related services as agreed upon by the parties. Compensation shall be paid according to the terms separately agreed upon by the Campaign and Contractor. The Contractor is solely responsible for all federal, state, and local taxes arising from payments made under this Agreement, including income taxes and self-employment taxes.

3. Assumption of Risk
The Contractor understands that campaign activities may involve physical exertion, travel, public engagement, extended hours, and other inherent risks. The Contractor knowingly and voluntarily assumes all risks of injury, illness, death, property damage, or loss arising out of or related to the performance of services under this Agreement, whether known or unknown, foreseeable or unforeseeable.

4. Insurance Requirements
The Contractor represents and warrants that they maintain, at their own expense, valid health insurance coverage and, where applicable, general liability insurance sufficient to cover claims arising from their services. The Campaign does not provide insurance coverage of any kind unless required by applicable law. Proof of insurance may be required upon request.

5. Release, Waiver, and Indemnification
To the fullest extent permitted by law, the Contractor releases and waives any and all claims against the Campaign, its officers, staff, volunteers, agents, and affiliates arising out of or related to the Contractor's services. The Contractor further agrees to indemnify and hold harmless the Campaign from any claims, damages, losses, or expenses arising from the Contractor's acts or omissions.

6. Compliance and Conduct
The Contractor agrees to comply with all applicable federal, state, and local laws and regulations, including campaign finance and election laws. The Contractor agrees to conduct themselves in a professional, lawful, and ethical manner while performing services under this Agreement.

7. Term and Termination
This Agreement may be terminated by either party at any time, with or without cause, subject to applicable law. Upon termination, the Contractor shall be compensated for services performed up to the date of termination, unless otherwise agreed.

8. Governing Law and Severability
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.

Contractor Signature: ${user?.agreements?.contractor?.signature ? "[SIGNED]" : "___________________________"}

Printed Name: ${user?.firstName} ${user?.lastName}

Date: ${user?.agreements?.contractor?.signedAt ? new Date(user.agreements.contractor.signedAt).toLocaleDateString() : "___________________________"}`,
    };

    return {
      ...displayInfo,
      content: baseContent[type] || "",
    };
  };

  // Handle signature drawing - SIMPLIFIED VERSION
  const startDrawing = (e) => {
    if (!context || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;

    if (e.type.includes("mouse")) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else if (e.type.includes("touch")) {
      e.preventDefault();
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    }

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !context || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x, y;

    if (e.type.includes("mouse")) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else if (e.type.includes("touch")) {
      e.preventDefault();
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (e) => {
    if (e && e.type.includes("touch")) {
      e.preventDefault();
    }

    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;

    // Convert canvas to data URL
    const signatureData = canvasRef.current.toDataURL("image/png");
    setSignature(signatureData);
    setShowSignaturePad(false);
    setUploadedImage(null);
    toast.success("Signature saved");
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;
      setSignature(imageUrl);
      setUploadedImage(file.name);
      setShowSignaturePad(false);
      toast.success("Signature image uploaded");
    };
    reader.readAsDataURL(file);
  };

  // Upload signature to Cloudinary
  const uploadSignatureToCloudinary = async (signatureData) => {
    try {
      let blob;
      if (signatureData.startsWith("data:image")) {
        const response = await fetch(signatureData);
        blob = await response.blob();
      } else {
        return signatureData;
      }

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "adcn_upload_preset");

      const cloudName = "webofzander";
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to upload signature to Cloudinary");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  // Sign agreement
  const handleSignAgreement = async () => {
    if (!signature) {
      toast.error("Please provide a signature");
      return;
    }

    if (!canSignAgreements()) {
      toast.error("You can only sign your own agreements");
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureUrl = await uploadSignatureToCloudinary(signature);
      const signatureType = uploadedImage ? "uploaded" : "drawn";

      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/agreements/sign/${user._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agreementType: activeAgreement,
          signatureUrl: signatureUrl,
          signatureType: signatureType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sign agreement");
      }

      toast.success("Agreement signed successfully");

      if (onAgreementSigned) {
        const updatedUser = {
          ...user,
          agreements: {
            ...user.agreements,
            [activeAgreement]: data.agreement,
          },
        };
        onAgreementSigned(updatedUser);
      }

      setSignature("");
      setUploadedImage(null);
    } catch (error) {
      console.error("Sign agreement error:", error);
      toast.error(error.message || "Failed to sign agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete signature
  const handleDeleteSignature = async () => {
    if (!canSignAgreements()) {
      toast.error("You can only delete your own signatures");
      return;
    }

    if (!confirm("Are you sure you want to delete this signature?")) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/agreements/signature/${user._id}/${activeAgreement}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete signature");
      }

      toast.success("Signature deleted successfully");

      if (onAgreementSigned) {
        onAgreementSigned();
      }

      setSignature("");
      setUploadedImage(null);
    } catch (error) {
      console.error("Delete signature error:", error);
      toast.error(error.message || "Failed to delete signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download agreement
  const handleDownloadAgreement = async () => {
    if (!canViewAgreements()) {
      toast.error("You can only download your own agreements");
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/agreements/download/${user._id}/${activeAgreement}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to download agreement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeAgreement}-agreement-${user.firstName}-${user.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Agreement downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download agreement");
    }
  };

  // Print agreement
  const handlePrintAgreement = () => {
    const template = getAgreementTemplate(activeAgreement);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${template.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
            pre { white-space: pre-wrap; font-size: 14px; }
            .signature-line { border-bottom: 1px solid #000; display: inline-block; width: 300px; margin: 20px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <pre>${template.content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!isOpen || !user) return null;

  const template = getAgreementTemplate(activeAgreement);
  const isAlreadySigned = user.agreements?.[activeAgreement]?.agreed;
  const canView = canViewAgreements();
  const canSign = canSignAgreements();
  const hasSignature = !!signature;
  const isAdmin = currentUser?.role === "admin";
  const isViewingOwnAgreement = currentUser?.id === user?._id;

  // Get total signed count
  const signedCount = requiredAgreements.filter(
    (type) => user.agreements?.[type]?.agreed,
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start md:items-center justify-center p-0 sm:p-2 md:p-4 overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90dvh] md:max-h-[90vh] flex flex-col m-0 sm:my-4 md:my-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Agreement Management
            </h2>
            <p className="text-sm text-gray-600">
              {user.firstName} {user.lastName} • {getRoleDisplayName(user.role)}
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${isAdmin ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}
              >
                {isAdmin ? "Admin User" : `${getRoleDisplayName(user.role)}`}
              </span>
              {isAdmin && !isViewingOwnAgreement && (
                <div className="mt-2 flex items-center text-blue-600">
                  <UserCog className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Admin View: Viewing {user.firstName}&apos;s agreements
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block w-64 border-r bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Agreements</h3>
            <div className="space-y-2">
              {requiredAgreements.map((type) => {
                const status = getAgreementStatus(type);
                const isActive = activeAgreement === type;
                const displayInfo = getAgreementDisplayInfo(type);
                const IconComponent = displayInfo.icon;

                return (
                  <button
                    key={type}
                    onClick={() => setActiveAgreement(type)}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {type === "volunteer"
                          ? "Volunteer Agreement"
                          : type === "staffer"
                            ? "Staffer Agreement"
                            : "Contractor Agreement"}
                      </span>
                    </div>
                    {status === "signed" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Status Summary */}
            <div className="mt-8">
              <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
              <div className="space-y-1">
                {requiredAgreements.map((type) => {
                  const status = getAgreementStatus(type);
                  const displayInfo = getAgreementDisplayInfo(type);
                  const IconComponent = displayInfo.icon;

                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <IconComponent className="h-3 w-3 mr-2" />
                        <span className="text-gray-600">
                          {type === "volunteer"
                            ? "Volunteer"
                            : type === "staffer"
                              ? "Staffer"
                              : "Contractor"}
                          :
                        </span>
                      </div>
                      <span
                        className={`font-medium ${
                          status === "signed"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {status === "signed" ? "Signed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Required for {getRoleDisplayName(user.role)}:</strong>
                </p>
                <ul className="mt-1 text-xs text-blue-700 list-disc list-inside">
                  {requiredAgreements.map((type) => (
                    <li key={type}>
                      {type === "volunteer"
                        ? "Volunteer Agreement"
                        : type === "staffer"
                          ? "Staffer Agreement"
                          : "Contractor Agreement"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            {canView && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-2">Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadAgreement}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={handlePrintAgreement}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden p-4 border-b">
            <select
              className="w-full p-3 border rounded-lg"
              value={activeAgreement}
              onChange={(e) => setActiveAgreement(e.target.value)}
            >
              {requiredAgreements.map((type) => {
                const status = getAgreementStatus(type);
                const label =
                  type === "volunteer"
                    ? "Volunteer Agreement"
                    : type === "staffer"
                      ? "Staffer Agreement"
                      : "Contractor Agreement";

                return (
                  <option key={type} value={type}>
                    {label} ({status === "signed" ? "Signed" : "Pending"})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Agreement Header */}
            <div className="p-4 md:p-6 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="mb-2 md:mb-0">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${template.bgColor} mr-3`}>
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        {template.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Last updated: {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isAlreadySigned ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Signed</span>
                      <span className="text-sm ml-2">
                        {new Date(
                          user.agreements[activeAgreement].signedAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      <span className="font-medium">Not Signed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Agreement Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="bg-white p-4 md:p-6 rounded-lg border mb-4 md:mb-6">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-x-auto">
                  {template.content}
                </pre>
              </div>

              {/* Signature Section */}
              {canView ? (
                <div className="p-4 md:p-6 border rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {isViewingOwnAgreement
                      ? "Your Signature"
                      : `${user.firstName}'s Signature`}
                  </h4>

                  {isAlreadySigned ? (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                          {isViewingOwnAgreement
                            ? "Your signature:"
                            : `${user.firstName}'s signature:`}
                        </p>
                        {user.agreements[activeAgreement].signature && (
                          <img
                            src={user.agreements[activeAgreement].signature}
                            alt="Signature"
                            className="max-w-full md:max-w-xs border rounded mx-auto"
                            onError={(e) => {
                              e.target.src = "/signature-placeholder.png";
                            }}
                          />
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          Signed on:{" "}
                          {new Date(
                            user.agreements[activeAgreement].signedAt,
                          ).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Signature type:{" "}
                          {user.agreements[activeAgreement].signatureType ||
                            "uploaded"}
                        </p>
                      </div>
                      {canSign && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={handleDeleteSignature}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            {isSubmitting ? "Deleting..." : "Delete Signature"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : canSign ? (
                    showSignaturePad ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Draw your signature:
                          </p>
                          <div className="relative">
                            <canvas
                              ref={canvasRef}
                              width={600}
                              height={200}
                              className="border rounded cursor-crosshair w-full max-w-[600px] h-[150px] md:h-[200px] mx-auto touch-none select-none"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              onTouchCancel={stopDrawing}
                              style={{
                                touchAction: "none",
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                                msTouchAction: "none",
                              }}
                            />
                            <div className="md:hidden text-xs text-gray-500 text-center mt-2">
                              Use your finger to draw
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={clearSignature}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Clear
                          </button>
                          <button
                            onClick={saveSignature}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Save Signature
                          </button>
                          <button
                            onClick={() => setShowSignaturePad(false)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : hasSignature ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Your signature:
                          </p>
                          <img
                            src={signature}
                            alt="Your signature"
                            className="max-w-full md:max-w-xs border rounded mx-auto"
                          />
                          {uploadedImage && (
                            <p className="text-sm text-gray-500 mt-1 text-center md:text-left">
                              Uploaded: {uploadedImage}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => {
                              setShowSignaturePad(true);
                              setSignature("");
                              setUploadedImage(null);
                            }}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Redraw Signature
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Upload Different Image
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                          <button
                            onClick={handleSignAgreement}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {isSubmitting ? "Signing..." : "Sign Agreement"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center p-6 md:p-8 border-2 border-dashed rounded-lg">
                          <Signature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Please provide your signature to sign this agreement
                          </p>
                          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
                            <button
                              onClick={() => setShowSignaturePad(true)}
                              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Signature className="h-4 w-4 inline mr-2" />
                              Draw Signature
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 sm:px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <Upload className="h-4 w-4 inline mr-2" />
                              Upload Image
                            </button>
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-6 md:p-8 border-2 border-dashed rounded-lg bg-gray-50">
                      <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Agreement not signed yet
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.firstName} needs to sign this agreement. Only the
                        account owner can sign their own agreements.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 border rounded-lg bg-gray-50">
                  <div className="text-center p-8">
                    <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Access Restricted</p>
                    <p className="text-sm text-gray-500">
                      You can only view and sign your own agreements.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t bg-gray-50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div className="mb-3 md:mb-0">
                  <p className="text-sm text-gray-600">
                    {requiredAgreements.length} agreement(s) required for{" "}
                    {getRoleDisplayName(user.role)} • {signedCount} signed •{" "}
                    {requiredAgreements.length - signedCount} pending
                  </p>
                  {isAdmin && !isViewingOwnAgreement && !isAlreadySigned && (
                    <p className="text-sm text-blue-600 mt-1">
                      {user.firstName} needs to sign this agreement
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 order-2 sm:order-1"
                  >
                    Close
                  </button>
                  {canSign && !isAlreadySigned && hasSignature && (
                    <button
                      onClick={handleSignAgreement}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 order-1 sm:order-2"
                    >
                      {isSubmitting ? "Signing..." : "Sign Agreement"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
