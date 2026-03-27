const { uploadImageToCloudinary } = require("../middleware/uploadMiddleware");
const Campaign = require("../models/Campaign");
const User = require("../models/User");

// Helper function to generate unique Campaign IDs
const generateCampaignID = () =>
  "CMP-" + Math.random().toString(36).substring(2, 10).toUpperCase();

const addNewClient = async (req, res) => {
  try {
    const {
      title,
      candidateName,
      office,
      state,
      party,
      firstName,
      lastName,
      email,
    } = req.body;

    const existingTitle = await Campaign.findOne({ title });

    if (existingTitle) {
      return res.status(400).json({
        success: false,
        message: "This title already exists",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "An admin already exists with this email",
      });
    }

    const logoFile = req.files?.logo?.[0];

    if (!logoFile) {
      return res.status(400).json({
        success: false,
        message: "Please upload the campaign logo",
      });
    }

    const uploaded = await uploadImageToCloudinary(
      logoFile.buffer,
      "OCOA/Logos",
    );

    const newCampaign = await Campaign.create({
      logo: {
        publicId: uploaded.public_id,
        url: uploaded.secure_url,
      },
      title,
      candidateName,
      office,
      state,
      campaignID: generateCampaignID(),
      party,
    });

    const newClientAdmin = await User.create({
      firstName,
      lastName,
      email,
      password: "Admin@CPN$159", // Default password - user should change this
      role: "client_admin",
      title: "Administrator",
      area: "Leadership",
      status: "active",
      phone: "+1234567890",
      twoFactorEnabled: false,
      campaign: newCampaign._id,
    });

    newCampaign.clientAdmin = newClientAdmin._id;
    await newCampaign.save();

    return res.status(201).json({
      success: true,
      message: "New campaign created successfully",
    });
  } catch (error) {
    console.error("Create new campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to Create new campaign",
    });
  }
};

module.exports = {
  addNewClient,
};
