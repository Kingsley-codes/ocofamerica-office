const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { jsPDF } = require("jspdf");
const mongoose = require("mongoose");
const axios = require("axios"); // Add axios for fetching external images

// Helper function to get required agreements for each role
const getRequiredAgreementsForRole = (role) => {
  console.log("DEBUG: [getRequiredAgreementsForRole] Role:", role);
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

// Helper function to add image to PDF with error handling
const addSignatureToPDF = async (
  doc,
  signatureUrl,
  x,
  y,
  width = 100,
  height = 50,
) => {
  try {
    if (!signatureUrl) {
      console.log("DEBUG: [addSignatureToPDF] No signature URL provided");
      return false;
    }

    console.log(
      "DEBUG: [addSignatureToPDF] Adding signature to PDF:",
      signatureUrl.substring(0, 100) + "...",
    );

    // Handle base64 data URLs
    if (signatureUrl.startsWith("data:image")) {
      try {
        const base64Data = signatureUrl.split(",")[1];
        // Determine image format
        let format = "PNG";
        if (
          signatureUrl.includes("image/jpeg") ||
          signatureUrl.includes("image/jpg")
        ) {
          format = "JPEG";
        }
        doc.addImage(base64Data, format, x, y, width, height);
        console.log(
          "DEBUG: [addSignatureToPDF] Base64 signature added successfully",
        );
        return true;
      } catch (error) {
        console.error(
          "ERROR: [addSignatureToPDF] Failed to add base64 image:",
          error.message,
        );
        // Fallback to text
        doc.setFontSize(10);
        doc.text("___________________________", x, y);
        doc.setFontSize(8);
        doc.text("(Signed electronically)", x, y + 5);
        return false;
      }
    }
    // Handle Cloudinary URLs or other image URLs
    else if (signatureUrl.startsWith("http")) {
      console.log(
        "DEBUG: [addSignatureToPDF] Fetching external image:",
        signatureUrl,
      );

      try {
        // Fetch the image
        const response = await axios.get(signatureUrl, {
          responseType: "arraybuffer",
          timeout: 10000, // 10 second timeout
        });

        // Convert to base64
        const base64Image = Buffer.from(response.data, "binary").toString(
          "base64",
        );

        // Determine content type from response headers
        let format = "PNG";
        const contentType = response.headers["content-type"];
        if (contentType) {
          if (contentType.includes("jpeg") || contentType.includes("jpg")) {
            format = "JPEG";
          } else if (contentType.includes("png")) {
            format = "PNG";
          }
        }

        // Add to PDF
        doc.addImage(
          `data:image/${format.toLowerCase()};base64,${base64Image}`,
          format,
          x,
          y,
          width,
          height,
        );
        console.log(
          "DEBUG: [addSignatureToPDF] External signature added successfully",
        );
        return true;
      } catch (error) {
        console.error(
          "ERROR: [addSignatureToPDF] Failed to fetch external image:",
          error.message,
        );

        // For Cloudinary URLs, we can try to add them directly
        if (signatureUrl.includes("cloudinary.com")) {
          try {
            // For jsPDF, we can try to add the URL directly (some versions support this)
            doc.addImage(signatureUrl, "PNG", x, y, width, height);
            console.log(
              "DEBUG: [addSignatureToPDF] Added Cloudinary URL directly",
            );
            return true;
          } catch (directError) {
            console.error(
              "ERROR: [addSignatureToPDF] Failed to add Cloudinary URL directly:",
              directError.message,
            );
          }
        }

        // Fallback to text
        doc.setFontSize(10);
        doc.text("___________________________", x, y);
        doc.setFontSize(8);
        doc.text("(Signature on file)", x, y + 5);
        return false;
      }
    } else {
      // Unknown format
      console.log("DEBUG: [addSignatureToPDF] Unknown signature format");
      doc.setFontSize(10);
      doc.text("___________________________", x, y);
      doc.setFontSize(8);
      doc.text("(Signed)", x, y + 5);
      return false;
    }
  } catch (error) {
    console.error(
      "ERROR: [addSignatureToPDF] Failed to add signature:",
      error.message,
    );
    // Always add some indication that a signature exists
    doc.setFontSize(10);
    doc.text("___________________________", x, y);
    doc.setFontSize(8);
    doc.text("(Signed)", x, y + 5);
    return false;
  }
};

// Get agreement templates
const getAgreementTemplates = async (req, res) => {
  console.log("DEBUG: [getAgreementTemplates] Request received");
  console.log("DEBUG: [getAgreementTemplates] User:", req.user?.email);
  console.log("DEBUG: [getAgreementTemplates] User ID:", req.user?.userId);

  try {
    const templates = {
      volunteer: {
        title: "CAMPAIGN VOLUNTEER AGREEMENT",
        content: `CAMPAIGN VOLUNTEER AGREEMENT
This Campaign Volunteer Agreement ("Agreement") is entered into voluntarily by __________________________ ("Volunteer") and __________________________ Campaign ("Campaign").

1. Voluntary Service and No Compensation
I, __________________________, voluntarily agree to provide services to the __________________________ Campaign as a volunteer. I understand and acknowledge that my services are provided freely and without expectation of wages, salary, benefits, or any other form of compensation. I further understand that this Agreement does not create an employment relationship between myself and the Campaign.

2. Assumption of Risk
I understand that volunteering for the Campaign may involve activities that carry inherent risks, including but not limited to physical activity, travel, interaction with the public, and exposure to unforeseen hazards. I knowingly and voluntarily assume full responsibility for any and all risks of injury, illness, property damage, or loss that may arise from my participation in Campaign activities, whether foreseen or unforeseen.

3. Release and Waiver of Liability
To the fullest extent permitted by law, I hereby release, waive, and discharge the Campaign, its officers, staff, volunteers, agents, and affiliates from any and all claims, liabilities, demands, actions, or causes of action arising out of or related to my volunteer activities, including but not limited to personal injury, property damage, or other losses, except where prohibited by law.

4. Compliance With Laws and Conduct
I agree to conduct myself in a professional, lawful, and respectful manner while representing or volunteering for the Campaign. I agree to comply with all applicable federal, state, and local laws, regulations, and Campaign policies. I understand that the Campaign may terminate my volunteer participation at any time, with or without cause.

5. Governing Law and Severability
This Agreement shall be governed by and interpreted in accordance with the laws of the United States and the applicable laws of the state in which the volunteer activity occurs. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
      },
      staffer: {
        title: "CAMPAIGN STAFFER AGREEMENT",
        content: `CAMPAIGN STAFFER AGREEMENT
This Campaign Staffer Agreement ("Agreement") is entered into by and between __________________________ Campaign ("Campaign") and __________________________ ("Staffer").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
      },
      contractor: {
        title: "INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT",
        content: `INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT
This Independent Contractor Agreement ("Agreement") is entered into by and between __________________________ Campaign ("Campaign") and __________________________ ("Contractor").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
      },
    };

    console.log("DEBUG: [getAgreementTemplates] Returning templates");

    return res.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("ERROR: [getAgreementTemplates]", error);
    console.error("ERROR: [getAgreementTemplates] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get user agreements - USER CAN ONLY GET THEIR OWN
const getUserAgreements = async (req, res) => {
  console.log("DEBUG: [getUserAgreements] Request received");
  console.log("DEBUG: [getUserAgreements] User:", req.user?.email);
  console.log("DEBUG: [getUserAgreements] Params:", req.params);
  console.log("DEBUG: [getUserAgreements] Query:", req.query);

  try {
    const { userId } = req.params;
    const { agreementType } = req.query;

    console.log("DEBUG: [getUserAgreements] Checking permissions:");
    console.log("DEBUG: [getUserAgreements] userId from params:", userId);
    console.log(
      "DEBUG: [getUserAgreements] req.user.userId:",
      req.user?.userId,
    );

    // Check if user is requesting their own agreements
    if (userId !== req.user?.userId?.toString()) {
      console.error(
        "ERROR: [getUserAgreements] Permission denied - User mismatch",
      );
      return res.status(403).json({
        success: false,
        message: "You can only view your own agreements",
      });
    }

    console.log(
      "DEBUG: [getUserAgreements] Permission granted, fetching user...",
    );

    // Use lean() to avoid validation
    const user = await User.findById(userId)
      .select("firstName lastName email role agreements")
      .lean();

    if (!user) {
      console.error("ERROR: [getUserAgreements] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get required agreements based on role
    const requiredAgreements = getRequiredAgreementsForRole(user.role);
    console.log(
      "DEBUG: [getUserAgreements] Required agreements for role",
      user.role,
      ":",
      requiredAgreements,
    );

    let agreements = user.agreements || {};

    // Filter by type if specified
    if (agreementType) {
      console.log(
        "DEBUG: [getUserAgreements] Filtering by type:",
        agreementType,
      );
      agreements = {
        [agreementType]: agreements[agreementType] || null,
      };
    }

    // Get agreement status
    const signedAgreements = requiredAgreements.filter(
      (type) => agreements[type]?.agreed,
    );

    let status = "not_signed";
    if (signedAgreements.length === requiredAgreements.length) {
      status = "fully_signed";
    } else if (signedAgreements.length > 0) {
      status = "partially_signed";
    }

    console.log("DEBUG: [getUserAgreements] Status:", status);

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
      agreements,
      requiredAgreements,
      status,
      signedAgreements,
    });
  } catch (error) {
    console.error("ERROR: [getUserAgreements]", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get my agreements (current user)
const getMyAgreements = async (req, res) => {
  console.log("DEBUG: [getMyAgreements] Request received");
  console.log("DEBUG: [getMyAgreements] User:", req.user?.email);
  console.log("DEBUG: [getMyAgreements] User ID:", req.user?.userId);

  try {
    // Use lean() to avoid validation
    const user = await User.findById(req.user.userId)
      .select("firstName lastName email role agreements")
      .lean();

    if (!user) {
      console.error(
        "ERROR: [getMyAgreements] User not found:",
        req.user.userId,
      );
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get required agreements based on role
    const requiredAgreements = getRequiredAgreementsForRole(user.role);
    console.log(
      "DEBUG: [getMyAgreements] Required agreements:",
      requiredAgreements,
    );

    const agreements = user.agreements || {};

    // Get agreement status
    const signedAgreements = requiredAgreements.filter(
      (type) => agreements[type]?.agreed,
    );

    let status = "not_signed";
    if (signedAgreements.length === requiredAgreements.length) {
      status = "fully_signed";
    } else if (signedAgreements.length > 0) {
      status = "partially_signed";
    }

    console.log("DEBUG: [getMyAgreements] Status:", status);

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
      agreements,
      requiredAgreements,
      status,
      signedAgreements,
    });
  } catch (error) {
    console.error("ERROR: [getMyAgreements]", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Sign agreement - USER CAN ONLY SIGN THEIR OWN
const signAgreement = async (req, res) => {
  console.log("DEBUG: [signAgreement] Request received");
  console.log("DEBUG: [signAgreement] User:", req.user?.email);
  console.log("DEBUG: [signAgreement] Params:", req.params);
  console.log("DEBUG: [signAgreement] Body:", {
    ...req.body,
    signatureUrl: req.body.signatureUrl
      ? req.body.signatureUrl.substring(0, 50) + "..."
      : "none",
  });

  try {
    const { userId } = req.params;
    const { agreementType, signatureUrl, signatureType } = req.body;

    console.log("DEBUG: [signAgreement] Checking permissions:");
    console.log("DEBUG: [signAgreement] userId from params:", userId);
    console.log("DEBUG: [signAgreement] req.user.userId:", req.user?.userId);
    console.log(
      "DEBUG: [signAgreement] Type comparison:",
      typeof userId,
      typeof req.user?.userId,
    );

    // Check if user is signing their own agreement
    if (userId !== req.user?.userId?.toString()) {
      console.error("ERROR: [signAgreement] Permission denied - User mismatch");
      console.error(
        "ERROR: [signAgreement] Expected:",
        req.user?.userId?.toString(),
      );
      console.error("ERROR: [signAgreement] Got:", userId);
      return res.status(403).json({
        success: false,
        message: "You can only sign your own agreements",
      });
    }

    console.log("DEBUG: [signAgreement] Permission granted, fetching user...");

    // Use lean() to get plain JavaScript object
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error("ERROR: [signAgreement] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate agreement type
    if (!["volunteer", "staffer", "contractor"].includes(agreementType)) {
      console.error(
        "ERROR: [signAgreement] Invalid agreement type:",
        agreementType,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid agreement type",
      });
    }

    // Check if this agreement type is required for user's role
    const requiredAgreements = getRequiredAgreementsForRole(user.role);
    if (!requiredAgreements.includes(agreementType)) {
      console.error(
        "ERROR: [signAgreement] Agreement not required for role:",
        agreementType,
        user.role,
      );
      return res.status(400).json({
        success: false,
        message: `This agreement type (${agreementType}) is not required for your role (${user.role})`,
      });
    }

    // Check if already signed
    if (user.agreements && user.agreements[agreementType]?.agreed) {
      console.error(
        "ERROR: [signAgreement] Agreement already signed:",
        agreementType,
      );
      return res.status(400).json({
        success: false,
        message: "Agreement already signed",
      });
    }

    console.log("DEBUG: [signAgreement] Updating agreement...");

    // Prepare update data
    const updateData = {
      [`agreements.${agreementType}`]: {
        agreed: true,
        signature: signatureUrl,
        signedAt: new Date(),
        signedBy: req.user.userId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        signatureType: signatureType || "uploaded",
      },
    };

    // Use findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: false, // Disable validators to avoid w9Form validation
      },
    );

    console.log("DEBUG: [signAgreement] User updated successfully");

    // Log audit
    await AuditLog.create({
      action: "Sign agreement",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: {
        agreementType,
        signedForSelf: true,
        userRole: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    console.log("DEBUG: [signAgreement] Audit log created");

    return res.json({
      success: true,
      message: "Agreement signed successfully",
      agreement: updateData[`agreements.${agreementType}`],
    });
  } catch (error) {
    console.error("ERROR: [signAgreement]", error);
    console.error("ERROR: [signAgreement] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to sign agreement",
    });
  }
};

// Delete signature - USER CAN ONLY DELETE THEIR OWN
const deleteSignature = async (req, res) => {
  console.log("DEBUG: [deleteSignature] Request received");
  console.log("DEBUG: [deleteSignature] User:", req.user?.email);
  console.log("DEBUG: [deleteSignature] Params:", req.params);

  try {
    const { userId, agreementType } = req.params;

    console.log("DEBUG: [deleteSignature] Checking permissions:");
    console.log("DEBUG: [deleteSignature] userId from params:", userId);
    console.log("DEBUG: [deleteSignature] req.user.userId:", req.user?.userId);

    // Convert both to strings for comparison
    const paramsUserIdStr = userId;
    const reqUserIdStr = req.user.userId.toString();

    console.log("DEBUG: [deleteSignature] paramsUserIdStr:", paramsUserIdStr);
    console.log("DEBUG: [deleteSignature] reqUserIdStr:", reqUserIdStr);

    // Check if user is deleting their own signature
    if (paramsUserIdStr !== reqUserIdStr) {
      console.error(
        "ERROR: [deleteSignature] Permission denied - User mismatch",
      );
      return res.status(403).json({
        success: false,
        message: "You can only delete your own signatures",
      });
    }

    console.log(
      "DEBUG: [deleteSignature] Permission granted, fetching user...",
    );

    // Use lean() to get plain JavaScript object, not Mongoose document
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error("ERROR: [deleteSignature] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.agreements || !user.agreements[agreementType]) {
      console.error(
        "ERROR: [deleteSignature] Signature not found:",
        agreementType,
      );
      return res.status(404).json({
        success: false,
        message: "Signature not found",
      });
    }

    console.log("DEBUG: [deleteSignature] Updating agreement...");

    // Use findByIdAndUpdate to avoid validation issues
    const updateData = {
      [`agreements.${agreementType}`]: {
        agreed: false,
        signature: null,
        signedAt: null,
        signedBy: null,
        ipAddress: null,
        userAgent: null,
        signatureType: null,
      },
    };

    // Update the user document directly
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: false, // Disable validators to avoid w9Form validation
      },
    );

    console.log("DEBUG: [deleteSignature] User updated successfully");

    // Log audit
    await AuditLog.create({
      action: "Delete signature",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: {
        agreementType,
        deletedOwnSignature: true,
        userRole: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    console.log("DEBUG: [deleteSignature] Audit log created");

    return res.json({
      success: true,
      message: "Signature deleted successfully",
    });
  } catch (error) {
    console.error("ERROR: [deleteSignature]", error);
    console.error("ERROR: [deleteSignature] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to delete signature",
    });
  }
};

// Download agreement - USER CAN ONLY DOWNLOAD THEIR OWN (EXCEPT ADMIN)
const downloadAgreement = async (req, res) => {
  console.log("DEBUG: [downloadAgreement] Request received");
  console.log("DEBUG: [downloadAgreement] User:", req.user?.email);
  console.log("DEBUG: [downloadAgreement] User Role:", req.user?.role);
  console.log("DEBUG: [downloadAgreement] Params:", req.params);

  try {
    const { userId, agreementType } = req.params;

    console.log("DEBUG: [downloadAgreement] Checking permissions:");
    console.log("DEBUG: [downloadAgreement] userId from params:", userId);
    console.log(
      "DEBUG: [downloadAgreement] req.user.userId:",
      req.user?.userId,
    );
    console.log("DEBUG: [downloadAgreement] req.user.role:", req.user?.role);

    // Check if user is downloading their own agreement OR if they're an admin
    const isAdmin = req.user?.role === "admin";
    const isOwnAgreement = userId === req.user.userId.toString();

    if (!isOwnAgreement && !isAdmin) {
      console.error(
        "ERROR: [downloadAgreement] Permission denied - User mismatch",
      );
      console.error(
        "ERROR: [downloadAgreement] User is not admin and not downloading their own agreement",
      );
      return res.status(403).json({
        success: false,
        message:
          "You can only download your own agreements unless you are an admin",
      });
    }

    console.log(
      `DEBUG: [downloadAgreement] Permission granted (${isAdmin ? "Admin access" : "Own agreement"}), fetching user...`,
    );

    const user = await User.findById(userId);
    if (!user) {
      console.error("ERROR: [downloadAgreement] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get agreement template WITHOUT signature line in the text (we'll add it separately)
    const templates = {
      volunteer: {
        title: "CAMPAIGN VOLUNTEER AGREEMENT",
        content: `CAMPAIGN VOLUNTEER AGREEMENT
This Campaign Volunteer Agreement ("Agreement") is entered into voluntarily by ${user.firstName} ${user.lastName} ("Volunteer") and Campaign ("Campaign").

1. Voluntary Service and No Compensation
I, ${user.firstName} ${user.lastName}, voluntarily agree to provide services to the Campaign as a volunteer. I understand and acknowledge that my services are provided freely and without expectation of wages, salary, benefits, or any other form of compensation. I further understand that this Agreement does not create an employment relationship between myself and the Campaign.

2. Assumption of Risk
I understand that volunteering for the Campaign may involve activities that carry inherent risks, including but not limited to physical activity, travel, interaction with the public, and exposure to unforeseen hazards. I knowingly and voluntarily assume full responsibility for any and all risks of injury, illness, property damage, or loss that may arise from my participation in Campaign activities, whether foreseen or unforeseen.

3. Release and Waiver of Liability
To the fullest extent permitted by law, I hereby release, waive, and discharge the Campaign, its officers, staff, volunteers, agents, and affiliates from any and all claims, liabilities, demands, actions, or causes of action arising out of or related to my volunteer activities, including but not limited to personal injury, property damage, or other losses, except where prohibited by law.

4. Compliance With Laws and Conduct
I agree to conduct myself in a professional, lawful, and respectful manner while representing or volunteering for the Campaign. I agree to comply with all applicable federal, state, and local laws, regulations, and Campaign policies. I understand that the Campaign may terminate my volunteer participation at any time, with or without cause.

5. Governing Law and Severability
This Agreement shall be governed by and interpreted in accordance with the laws of the United States and the applicable laws of the state in which the volunteer activity occurs. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Volunteer Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
      staffer: {
        title: "CAMPAIGN STAFFER AGREEMENT",
        content: `CAMPAIGN STAFFER AGREEMENT
This Campaign Staffer Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user.firstName} ${user.lastName} ("Staffer").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Staffer Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
      contractor: {
        title: "INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT",
        content: `INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT
This Independent Contractor Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user.firstName} ${user.lastName} ("Contractor").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Contractor Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
    };

    const template = templates[agreementType];
    if (!template) {
      console.error(
        "ERROR: [downloadAgreement] Invalid agreement type:",
        agreementType,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid agreement type",
      });
    }

    console.log("DEBUG: [downloadAgreement] Creating PDF...");

    // Create PDF
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - margin * 2;

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(template.title, pageWidth / 2, 20, { align: "center" });

    // Add content with proper pagination
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Split text into lines
    const lines = doc.splitTextToSize(template.content, contentWidth);
    const lineHeight = 5;
    const signatureSectionHeight = 90; // Space needed for signature section

    let currentY = 40; // Start below title
    const maxY = pageHeight - margin - signatureSectionHeight; // Leave room for signature

    // Add content with pagination
    for (let i = 0; i < lines.length; i++) {
      // Check if we need a new page
      if (currentY > maxY) {
        doc.addPage();
        currentY = margin;
      }

      doc.text(lines[i], margin, currentY);
      currentY += lineHeight;
    }

    // Ensure we have enough space for signature section
    if (currentY > maxY) {
      doc.addPage();
      currentY = margin;
    } else {
      // Add some space before signature section
      currentY += 20;
    }

    // Now add signature section at the current position
    await addSignatureSectionToPDF(doc, user, agreementType, currentY, margin);

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");
    console.log(
      "DEBUG: [downloadAgreement] PDF created, size:",
      pdfBuffer.byteLength,
    );

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${agreementType}-agreement-${user.firstName}-${user.lastName}.pdf`,
    );

    // Send PDF
    res.send(Buffer.from(pdfBuffer));
    console.log("DEBUG: [downloadAgreement] PDF sent to client");

    // Log audit
    await AuditLog.create({
      action: "Download agreement",
      user: req.user.userId,
      userEmail: req.user.email,
      userRole: req.user.role,
      targetId: user._id,
      targetType: "User",
      details: {
        agreementType,
        downloadedOwnAgreement: isOwnAgreement,
        downloadedAsAdmin: isAdmin,
        userRole: user.role,
        targetUserRole: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    console.log("DEBUG: [downloadAgreement] Audit log created");
  } catch (error) {
    console.error("ERROR: [downloadAgreement]", error);
    console.error("ERROR: [downloadAgreement] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to download agreement",
    });
  }
};

// New improved helper function to add signature section
const addSignatureSectionToPDF = async (
  doc,
  user,
  agreementType,
  startY,
  margin,
) => {
  console.log(
    "DEBUG: [addSignatureSectionToPDF] Adding signature section at Y:",
    startY,
  );

  // Get signature label based on agreement type
  let signatureLabel;
  switch (agreementType) {
    case "volunteer":
      signatureLabel = "Volunteer Signature:";
      break;
    case "staffer":
      signatureLabel = "Staffer Signature:";
      break;
    case "contractor":
      signatureLabel = "Contractor Signature:";
      break;
    default:
      signatureLabel = "Signature:";
  }

  // Add signature label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(signatureLabel, margin, startY);

  // Get signature from user agreements
  const signature = user.agreements[agreementType]?.signature;

  if (signature) {
    console.log("DEBUG: [addSignatureSectionToPDF] Adding signature image");

    // Add signature image
    try {
      const signatureAdded = await addSignatureToPDF(
        doc,
        signature,
        margin,
        startY + 5,
        100,
        40,
      );

      if (!signatureAdded) {
        // Fallback to signature line
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("___________________________", margin, startY + 10);
      }
    } catch (error) {
      console.error(
        "DEBUG: [addSignatureSectionToPDF] Error adding signature:",
        error.message,
      );
      // Fallback to signature line
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("___________________________", margin, startY + 10);
    }
  } else {
    // No signature, add signature line
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("___________________________", margin, startY + 10);
  }

  // Add printed name
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Printed Name: ${user.firstName} ${user.lastName}`,
    margin,
    startY + 60,
  );

  // Add date
  const signedAt = user.agreements[agreementType]?.signedAt;
  const dateText = signedAt
    ? `Date: ${new Date(signedAt).toLocaleDateString()}`
    : "Date: ___________________________";
  doc.text(dateText, margin, startY + 70);

  console.log(
    "DEBUG: [addSignatureSectionToPDF] Signature section added successfully",
  );
};

// Get agreement status - USER CAN ONLY CHECK THEIR OWN
const getAgreementStatus = async (req, res) => {
  console.log("DEBUG: [getAgreementStatus] Request received");
  console.log("DEBUG: [getAgreementStatus] User:", req.user?.email);
  console.log("DEBUG: [getAgreementStatus] Params:", req.params);

  try {
    const { userId } = req.params;

    console.log("DEBUG: [getAgreementStatus] Checking permissions:");
    console.log("DEBUG: [getAgreementStatus] userId from params:", userId);
    console.log(
      "DEBUG: [getAgreementStatus] req.user.userId:",
      req.user?.userId,
    );

    // Check if user is checking their own status
    if (userId !== req.user.userId.toString()) {
      console.error(
        "ERROR: [getAgreementStatus] Permission denied - User mismatch",
      );
      return res.status(403).json({
        success: false,
        message: "You can only check your own agreement status",
      });
    }

    console.log(
      "DEBUG: [getAgreementStatus] Permission granted, fetching user...",
    );

    const user = await User.findById(userId).select("role agreements");
    if (!user) {
      console.error("ERROR: [getAgreementStatus] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get required agreements based on role
    const requiredAgreements = getRequiredAgreementsForRole(user.role);
    console.log(
      "DEBUG: [getAgreementStatus] Required agreements:",
      requiredAgreements,
    );

    const signedAgreements = requiredAgreements.filter(
      (type) => user.agreements[type]?.agreed,
    );

    let status = "not_signed";
    if (signedAgreements.length === requiredAgreements.length) {
      status = "fully_signed";
    } else if (signedAgreements.length > 0) {
      status = "partially_signed";
    }

    console.log("DEBUG: [getAgreementStatus] Status:", status);
    console.log(
      "DEBUG: [getAgreementStatus] Signed agreements:",
      signedAgreements,
    );

    return res.json({
      success: true,
      status,
      requiredAgreements,
      signedAgreements,
      agreements: user.agreements,
    });
  } catch (error) {
    console.error("ERROR: [getAgreementStatus]", error);
    console.error("ERROR: [getAgreementStatus] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Generate agreement PDF (returns PDF data for frontend)
const generateAgreementPDF = async (req, res) => {
  console.log("DEBUG: [generateAgreementPDF] Request received");
  console.log("DEBUG: [generateAgreementPDF] User:", req.user?.email);
  console.log("DEBUG: [generateAgreementPDF] Params:", req.params);
  console.log("DEBUG: [generateAgreementPDF] Body:", req.body);

  try {
    const { userId, agreementType } = req.params;
    const { signatureUrl } = req.body; // Optional: pass signature URL if not in database

    console.log("DEBUG: [generateAgreementPDF] Checking permissions:");
    console.log("DEBUG: [generateAgreementPDF] userId from params:", userId);
    console.log(
      "DEBUG: [generateAgreementPDF] req.user.userId:",
      req.user?.userId,
    );

    // Check if user is generating their own agreement
    if (userId !== req.user.userId.toString()) {
      console.error(
        "ERROR: [generateAgreementPDF] Permission denied - User mismatch",
      );
      return res.status(403).json({
        success: false,
        message: "You can only generate your own agreements",
      });
    }

    console.log(
      "DEBUG: [generateAgreementPDF] Permission granted, fetching user...",
    );

    const user = await User.findById(userId);
    if (!user) {
      console.error("ERROR: [generateAgreementPDF] User not found:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get agreement template WITHOUT signature line in the text (we'll add it separately)
    const templates = {
      volunteer: {
        title: "CAMPAIGN VOLUNTEER AGREEMENT",
        content: `CAMPAIGN VOLUNTEER AGREEMENT
This Campaign Volunteer Agreement ("Agreement") is entered into voluntarily by ${user.firstName} ${user.lastName} ("Volunteer") and Campaign ("Campaign").

1. Voluntary Service and No Compensation
I, ${user.firstName} ${user.lastName}, voluntarily agree to provide services to the Campaign as a volunteer. I understand and acknowledge that my services are provided freely and without expectation of wages, salary, benefits, or any other form of compensation. I further understand that this Agreement does not create an employment relationship between myself and the Campaign.

2. Assumption of Risk
I understand that volunteering for the Campaign may involve activities that carry inherent risks, including but not limited to physical activity, travel, interaction with the public, and exposure to unforeseen hazards. I knowingly and voluntarily assume full responsibility for any and all risks of injury, illness, property damage, or loss that may arise from my participation in Campaign activities, whether foreseen or unforeseen.

3. Release and Waiver of Liability
To the fullest extent permitted by law, I hereby release, waive, and discharge the Campaign, its officers, staff, volunteers, agents, and affiliates from any and all claims, liabilities, demands, actions, or causes of action arising out of or related to my volunteer activities, including but not limited to personal injury, property damage, or other losses, except where prohibited by law.

4. Compliance With Laws and Conduct
I agree to conduct myself in a professional, lawful, and respectful manner while representing or volunteering for the Campaign. I agree to comply with all applicable federal, state, and local laws, regulations, and Campaign policies. I understand that the Campaign may terminate my volunteer participation at any time, with or without cause.

5. Governing Law and Severability
This Agreement shall be governed by and interpreted in accordance with the laws of the United States and the applicable laws of the state in which the volunteer activity occurs. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Volunteer Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
      staffer: {
        title: "CAMPAIGN STAFFER AGREEMENT",
        content: `CAMPAIGN STAFFER AGREEMENT
This Campaign Staffer Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user.firstName} ${user.lastName} ("Staffer").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Staffer Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
      contractor: {
        title: "INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT",
        content: `INDEPENDENT CONTRACTOR (1099) CAMPAIGN AGREEMENT
This Independent Contractor Agreement ("Agreement") is entered into by and between Campaign ("Campaign") and ${user.firstName} ${user.lastName} ("Contractor").

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
This Agreement shall be governed by and construed in accordance with applicable United States federal law and the laws of the state in which the services are primarily performed. If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
        signatureLabel: "Contractor Signature:",
        printedName: `Printed Name: ${user.firstName} ${user.lastName}`,
      },
    };

    const template = templates[agreementType];
    if (!template) {
      console.error(
        "ERROR: [generateAgreementPDF] Invalid agreement type:",
        agreementType,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid agreement type",
      });
    }

    console.log("DEBUG: [generateAgreementPDF] Creating PDF...");

    // Create PDF
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2;

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(template.title, pageWidth / 2, 20, { align: "center" });

    // Add content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(template.content, contentWidth);

    // Check if content fits on one page
    const lineHeight = 5;
    const contentHeight = lines.length * lineHeight;
    const maxContentHeight = 240; // Maximum height before adding new page

    if (contentHeight > maxContentHeight) {
      // Content is too long, split into multiple pages
      let currentY = 40;
      let currentPage = 1;
      const maxLinesPerPage = Math.floor((maxContentHeight - 40) / lineHeight);

      for (let i = 0; i < lines.length; i += maxLinesPerPage) {
        if (currentPage > 1) {
          doc.addPage();
          currentY = 40;
        }

        const pageLines = lines.slice(i, i + maxLinesPerPage);
        doc.text(pageLines, margin, currentY);
        currentY += pageLines.length * lineHeight;
        currentPage++;
      }

      // Set the signature position based on the last page
      const signatureY = currentY + 20;

      // Add signature section to the last page
      await addSignatureSection(
        doc,
        user,
        agreementType,
        signatureY,
        margin,
        signatureUrl,
      );
    } else {
      // Content fits on one page
      doc.text(lines, margin, 40);

      // Calculate position for signature section
      const signatureY = 40 + contentHeight + 30; // Position after content with some spacing

      // Add signature section
      await addSignatureSection(
        doc,
        user,
        agreementType,
        signatureY,
        margin,
        signatureUrl,
      );
    }

    // Generate PDF as base64 string
    const pdfBase64 = doc.output("datauristring");

    // Extract just the base64 data part
    const base64Data = pdfBase64.split(",")[1];

    console.log("DEBUG: [generateAgreementPDF] PDF generated successfully");

    // Return base64 data for frontend
    return res.json({
      success: true,
      pdfData: base64Data,
      fileName: `${agreementType}-agreement-${user.firstName}-${user.lastName}.pdf`,
      message: "PDF generated successfully",
    });
  } catch (error) {
    console.error("ERROR: [generateAgreementPDF]", error);
    console.error("ERROR: [generateAgreementPDF] Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to generate agreement PDF",
    });
  }
};

// Updated helper function to add signature section to PDF (with optional signatureUrl parameter)
const addSignatureSection = async (
  doc,
  user,
  agreementType,
  signatureY,
  margin,
  signatureUrl = null,
) => {
  // Add signature label
  doc.setFontSize(10);
  let signatureLabel;
  switch (agreementType) {
    case "volunteer":
      signatureLabel = "Volunteer Signature:";
      break;
    case "staffer":
      signatureLabel = "Staffer Signature:";
      break;
    case "contractor":
      signatureLabel = "Contractor Signature:";
      break;
    default:
      signatureLabel = "Signature:";
  }
  doc.text(signatureLabel, margin, signatureY);

  // Use provided signature URL or get from database
  const signature = signatureUrl || user.agreements[agreementType]?.signature;
  if (signature) {
    console.log("DEBUG: [addSignatureSection] Adding signature to PDF");

    // Try to add the signature image
    const signatureAdded = await addSignatureToPDF(
      doc,
      signature,
      margin,
      signatureY + 5,
      100,
      40, // Reduced height for better fit
    );

    if (!signatureAdded) {
      // If image couldn't be added, add signature line
      console.log(
        "DEBUG: [addSignatureSection] Could not add signature image, adding line",
      );
      doc.setFontSize(10);
      doc.text("___________________________", margin, signatureY + 10);
    }
  } else {
    // No signature, add signature line
    console.log(
      "DEBUG: [addSignatureSection] No signature found, adding signature line",
    );
    doc.setFontSize(10);
    doc.text("___________________________", margin, signatureY + 10);
  }

  // Add printed name
  doc.setFontSize(10);
  doc.text(
    `Printed Name: ${user.firstName} ${user.lastName}`,
    margin,
    signatureY + 60,
  );

  // Add date
  const signedAt = user.agreements[agreementType]?.signedAt;
  const dateText = signedAt
    ? `Date: ${new Date(signedAt).toLocaleDateString()}`
    : "Date: ___________________________";
  doc.text(dateText, margin, signatureY + 70);

  console.log(
    "DEBUG: [addSignatureSection] Signature section added with Printed Name and Date",
  );
};

module.exports = {
  getAgreementTemplates,
  getUserAgreements,
  getMyAgreements,
  signAgreement,
  deleteSignature,
  downloadAgreement,
  getAgreementStatus,
  generateAgreementPDF,
};
