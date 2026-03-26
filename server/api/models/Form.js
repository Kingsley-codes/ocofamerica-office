const mongoose = require("mongoose");

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "volunteer",
        "staff",
        "contractor",
        "compliance",
        "finance",
        "field",
        "legal",
        "other",
      ],
      default: "volunteer",
      required: true,
    },
    version: {
      type: String,
      default: "1.0",
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for better search performance
formSchema.index({ title: "text", description: "text" });
formSchema.index({ category: 1 });
formSchema.index({ createdAt: -1 });

const Form = mongoose.model("Form", formSchema);
module.exports = Form;
