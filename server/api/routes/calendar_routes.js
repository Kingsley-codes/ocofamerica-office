// api/routes/calendar_routes.js
const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authMiddleware");
const {
  searchUsers,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByDateRange,
  getUpcomingEvents,
  getOutOfOffice,
  updateAttendeeStatus,
  addReminder,
  getCalendarFeed,
  getPersonalizedFeed,
  exportEvents,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTimeOffRequests,
  approveTimeOff,
  getEventStats,
} = require("../controllers/calendarController");

// All calendar routes require authentication
router.use(verifyToken);

// ============================================
// User Search for Invites
// ============================================
router.get("/users/search", searchUsers);

// ============================================
// Event Routes
// ============================================

// Get events (with filters)
router.get("/", getEvents);

// Get events by date range (for calendar views)
router.get("/range", getEventsByDateRange);

// Get upcoming events
router.get("/upcoming", getUpcomingEvents);

// Get out of office entries
router.get("/out-of-office", getOutOfOffice);

// Get event statistics
router.get("/stats", getEventStats);

// Export events
router.get("/export", exportEvents);

// Get personalized calendar feed
router.get("/feed/personal", getPersonalizedFeed);

// Get calendar feed (public/team) - this is public with token
router.get("/feed/:token", getCalendarFeed);

// Get single event
router.get("/:id", getEvent);

// Create event
router.post("/", createEvent);

// Update event
router.put("/:id", updateEvent);

// Delete event
router.delete("/:id", deleteEvent);

// ============================================
// Attendee Routes
// ============================================

// Update attendee status (RSVP)
router.put("/:id/attendees/:userId", updateAttendeeStatus);

// ============================================
// Reminder Routes
// ============================================

// Add reminder to event
router.post("/:id/reminders", addReminder);

// ============================================
// Category Routes (Admin/Manager only)
// ============================================

// Get all categories
router.get("/categories/all", getCategories);

// Create category
router.post("/categories", authorize("admin", "manager"), createCategory);

// Update category
router.put("/categories/:id", authorize("admin", "manager"), updateCategory);

// Delete category
router.delete("/categories/:id", authorize("admin"), deleteCategory);

// ============================================
// Time Off Routes (Management only)
// ============================================

// Get time off requests
router.get(
  "/time-off/requests",
  authorize("admin", "manager"),
  getTimeOffRequests,
);

// Approve/deny time off
router.put(
  "/time-off/:id/approve",
  authorize("admin", "manager"),
  approveTimeOff,
);

module.exports = router;
