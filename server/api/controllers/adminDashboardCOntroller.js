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
      campaign: newCampaign,
    });
  } catch (error) {
    console.error("Create new campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to Create new campaign",
    });
  }
};

const fetchAllCampaigns = async (req, res) => {
  try {
    const { q, status, page = 1 } = req.query;

    const query = {};

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { candidateName: { $regex: q, $options: "i" } },
        { campaignID: { $regex: q, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const limit = 10;
    const currentPage = Number(page);
    const skip = (currentPage - 1) * limit;

    const allCanpaigns = await Campaign.find(query)
      .populate("clientAdmin", "firstName lastName phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCampaigns = await Campaign.countDocuments(query);

    return res.status(200).json({
      status: "success",
      campaigns: allCanpaigns,
      pagination: {
        total: totalCampaigns,
        page: currentPage,
        pages: Math.ceil(totalCampaigns / limit),
      },
    });
  } catch (error) {
    console.log("Error fetching campaigns:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const suspendCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        status: "error",
        message: "Campaign not found",
      });
    }

    if (campaign.status === "suspended") {
      return res.status(404).json({
        status: "error",
        message: "Campaign already suspended",
      });
    }

    campaign.status = "suspended";
    await campaign.save();
    return res.status(200).json({
      status: "success",
      message: "Canpaign successfully suspended",
    });
  } catch (error) {
    console.log("Error suspending campaign:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

const activateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        status: "error",
        message: "Campaign not found",
      });
    }

    if (campaign.status === "active") {
      return res.status(404).json({
        status: "error",
        message: "Campaign already active",
      });
    }

    campaign.status = "active";
    await campaign.save();

    return res.status(200).json({
      status: "success",
      message: "Canpaign successfully activated",
    });
  } catch (error) {
    console.log("Error activating campaign:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  addNewClient,
  fetchAllCampaigns,
  suspendCampaign,
  activateCampaign,
};
