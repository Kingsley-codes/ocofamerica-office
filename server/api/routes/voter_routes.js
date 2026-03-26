// api/routes/voter_routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  uploadVoters,
  getVoters,
  getVoterStats,
  updateVoter,
  exportVotersFull,
  exportVotersPhones,
  exportVotersEmails,
} = require("../controllers/voterController");

router.use(verifyToken);

router.get("/", getVoters);
router.get("/stats", getVoterStats);
router.get("/export/full", authorize("admin", "manager"), exportVotersFull);
router.get("/export/phones", authorize("admin", "manager"), exportVotersPhones);
router.get("/export/emails", authorize("admin", "manager"), exportVotersEmails);
router.post(
  "/upload",
  authorize("admin", "manager"),
  upload.single("file"),
  uploadVoters,
);
router.put("/:id", authorize("admin", "manager", "field"), updateVoter);

module.exports = router;
