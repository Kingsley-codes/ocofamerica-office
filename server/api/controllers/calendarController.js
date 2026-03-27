// api/controllers/calendarController.js
const CalendarEvent = require("../models/Calendar");
const CalendarCategory = require("../models/CalendarCategory");
const User = require("../models/User");
const ical = require("ical-generator");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { sendEmail } = require("../../../utils/emailService");

// Category color mapping
const CATEGORY_COLORS = {
  meeting: "#3B82F6",
  vacation: "#10B981",
  medical: "#EF4444",
  event: "#8B5CF6",
  debate: "#F59E0B",
  public_speaking: "#FBBF24",
  fundraiser: "#14B8A6",
  canvassing: "#1E3A8A",
  phone_banking: "#047857",
  donor_meeting: "#7C3AED",
  press_media: "#B45309",
  other: "#6B7280",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Generate recurring occurrences based on pattern
 */
const generateRecurringOccurrences = (
  startDate,
  endDate,
  recurring,
  maxOccurrences = 100,
) => {
  const occurrences = [];
  const duration = endDate - startDate;
  let currentStart = new Date(startDate);
  let count = 0;

  const {
    pattern,
    interval,
    endDate: recurEndDate,
    occurrences: maxOccurs,
    dayOfWeek,
    dayOfMonth,
  } = recurring;

  while (count < (maxOccurs || 100)) {
    if (count > 0) {
      switch (pattern) {
        case "daily":
          currentStart.setDate(currentStart.getDate() + interval);
          break;
        case "weekly":
          currentStart.setDate(currentStart.getDate() + interval * 7);
          break;
        case "monthly":
          currentStart.setMonth(currentStart.getMonth() + interval);
          if (dayOfMonth) {
            currentStart.setDate(dayOfMonth);
          }
          break;
        case "yearly":
          currentStart.setFullYear(currentStart.getFullYear() + interval);
          break;
        default:
          break;
      }
    }

    // Check if we've passed the end date
    if (recurEndDate && currentStart > new Date(recurEndDate)) {
      break;
    }

    // For weekly, check if this day is selected
    if (pattern === "weekly" && dayOfWeek && dayOfWeek.length > 0) {
      const currentDay = currentStart.getDay();
      if (!dayOfWeek.includes(currentDay)) {
        continue;
      }
    }

    const currentEnd = new Date(currentStart.getTime() + duration);

    occurrences.push({
      start: new Date(currentStart),
      end: currentEnd,
    });

    count++;

    // Stop if we've reached max occurrences
    if (maxOccurs && count >= maxOccurs) {
      break;
    }
  }

  return occurrences;
};

/**
 * Check if user can view event based on visibility
 */
const canViewEvent = (event, user) => {
  // Admin can see everything
  if (user.role === "client_admin") return true;

  // Creator can always see
  if (event.createdBy && event.createdBy.toString() === user._id.toString())
    return true;

  // Owner can always see
  if (event.owner && event.owner.toString() === user._id.toString())
    return true;

  // Check visibility
  switch (event.visibility) {
    case "public":
      return true;
    case "team":
      // All authenticated users can see team events
      return true;
    case "management":
      // Only managers and above
      return ["client_admin", "manager"].includes(user.role);
    case "private":
      // Only creator and admin (already checked admin and creator above)
      return false;
    case "invite_only":
      // Check if user is in attendees
      return event.attendees?.some(
        (a) => a.user && a.user.toString() === user._id.toString(),
      );
    default:
      return false;
  }
};

/**
 * Check if user can edit event
 */
const canEditEvent = (event, user) => {
  // Admin can edit everything
  if (user.role === "client_admin") return true;

  // Creator can edit
  if (event.createdBy && event.createdBy.toString() === user._id.toString())
    return true;

  // Owner can edit
  if (event.owner && event.owner.toString() === user._id.toString())
    return true;

  // Managers can edit management-visible events
  if (
    ["deputy_campaign_manager", "campaign_manager", "campaign_chair"].includes(
      user.role,
    ) &&
    ["management", "team", "public"].includes(event.visibility)
  ) {
    return true;
  }

  return false;
};

/**
 * Get all admin-level users based on role hierarchy
 * This captures all users with admin-level permissions
 */
const getAllAdminUsers = async (campaignId) => {
  try {
    // Define all roles that should receive admin notifications
    const adminLevelRoles = [
      // Level 1 - Executive Leadership
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

      // Level 2 - Oversight Access
      "scheduler",
      "legal",

      // Also include finance directors and media directors who need oversight
      "finance_director",
      "media_director",
      "communications_director",
      "data_director",
    ];

    const admins = await User.find({
      role: { $in: adminLevelRoles },
      status: "active",
      campaign: campaignId,
    }).select("_id email firstName lastName role");

    console.log(`Found ${admins.length} admin-level users to notify`);
    return admins;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
};

/**
 * Get invitation email template for attendees
 */
const getInvitationEmailTemplate = (event, eventUrl, attendeeName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #059669, #10b981); color: white; padding: 20px; text-align: center; }
        .content { background: #ffffff; padding: 30px; }
        .event-details { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 5px; color: white; font-weight: bold; }
        .accept { background: #10B981; }
        .decline { background: #EF4444; }
        .maybe { background: #F59E0B; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>You're Invited!</h2>
      </div>
      
      <div class="content">
        <p>Hello ${attendeeName || "there"},</p>
        <p>You have been invited to an event:</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0; color: #047857;">${event.title}</h3>
          <p><strong>When:</strong> ${new Date(event.startDate).toLocaleString()}</p>
          <p><strong>Where:</strong> ${event.location || "TBD"}</p>
          ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ""}
        </div>
        
        <p>Please respond to this invitation:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventUrl}?rsvp=yes" class="button accept">✓ Accept</a>
          <a href="${eventUrl}?rsvp=no" class="button decline">✗ Decline</a>
          <a href="${eventUrl}?rsvp=maybe" class="button maybe">? Maybe</a>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9em;">
          You can also view full details by clicking <a href="${eventUrl}">here</a>.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Campaign Back Office</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get admin notification template
 */
const getAdminNotificationTemplate = (event, eventUrl, admin) => {
  // Get attendee names if available
  const attendeeNames =
    event.attendees && event.attendees.length > 0
      ? event.attendees
          .map((a) => {
            if (a.user && a.user.firstName) {
              return `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim();
            }
            return "Unknown";
          })
          .join(", ")
      : "None";

  // Get event creator info
  const creatorName = event.createdBy
    ? `${event.createdBy.firstName || ""} ${event.createdBy.lastName || ""}`.trim()
    : "Unknown";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; }
        .content { background: #ffffff; padding: 30px; }
        .event-details { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
        .admin-badge { background: #ef4444; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
        .field-label { font-weight: bold; color: #4b5563; width: 120px; display: inline-block; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="admin-badge">ADMIN NOTIFICATION</div>
        <h2>New Calendar Event Created</h2>
      </div>
      
      <div class="content">
        <p>Hello ${admin.firstName || "Admin"},</p>
        <p>A new event has been created in the campaign calendar. As an administrator, you're receiving this notification for your awareness.</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0; color: #1e40af;">${event.title}</h3>
          
          <p><span class="field-label">Created by:</span> ${creatorName}</p>
          <p><span class="field-label">When:</span> ${new Date(event.startDate).toLocaleString()} - ${new Date(event.endDate).toLocaleString()}</p>
          <p><span class="field-label">Location:</span> ${event.location || "TBD"}</p>
          <p><span class="field-label">Category:</span> ${event.category || "Not specified"}</p>
          <p><span class="field-label">Visibility:</span> ${event.visibility || "team"}</p>
          <p><span class="field-label">Attendees:</span> ${attendeeNames}</p>
          ${
            event.recurring?.isRecurring
              ? `<p><span class="field-label">Recurring:</span> ${event.recurring.pattern} (every ${event.recurring.interval})</p>`
              : ""
          }
          ${
            event.isTimeOff
              ? `<p><span class="field-label">Time Off:</span> ${event.timeOffDetails?.type || "Request"}</p>`
              : ""
          }
        </div>
        
        <p><strong>Description:</strong></p>
        <p style="background: #f3f4f6; padding: 15px; border-radius: 5px;">${event.description || "No description provided"}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventUrl}" class="button">View Full Event Details</a>
        </div>
        
        <p><strong>Admin Actions Available:</strong></p>
        <ul>
          <li>Edit or cancel this event if needed</li>
          <li>Manage attendee responses</li>
          <li>Add to team calendars</li>
          <li>Export for reporting</li>
        </ul>
        
        <p style="color: #6B7280; font-size: 0.9em; margin-top: 30px; font-style: italic;">
          This is an automated admin notification sent to all campaign administrators.
          You're receiving this because of your admin-level permissions.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Campaign Back Office. All rights reserved.</p>
        <p>This is an administrative notification - please retain for your records.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get combined template for admins who are also attendees
 */
const getCombinedAdminAttendeeTemplate = (event, eventUrl, admin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #7c3aed, #8b5cf6); color: white; padding: 20px; text-align: center; }
        .invitation-section { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
        .admin-section { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0; }
        .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 5px; color: white; font-weight: bold; }
        .accept { background: #10B981; }
        .decline { background: #EF4444; }
        .maybe { background: #F59E0B; }
        .view-button { background: #3b82f6; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Event Invitation + Admin Notification</h2>
      </div>
      
      <div class="content">
        <p>Hello ${admin.firstName || "Admin"},</p>
        
        <div class="invitation-section">
          <h3 style="color: #047857; margin-top: 0;">📅 You're Invited as an Attendee</h3>
          <p>You have been invited to: <strong>${event.title}</strong></p>
          <p><strong>When:</strong> ${new Date(event.startDate).toLocaleString()}</p>
          <p><strong>Where:</strong> ${event.location || "TBD"}</p>
          
          <div style="margin: 20px 0;">
            <a href="${eventUrl}?rsvp=yes" class="button accept">✓ Accept</a>
            <a href="${eventUrl}?rsvp=no" class="button decline">✗ Decline</a>
            <a href="${eventUrl}?rsvp=maybe" class="button maybe">? Maybe</a>
          </div>
        </div>
        
        <div class="admin-section">
          <h3 style="color: #b91c1c; margin-top: 0;">🔔 Admin Notification</h3>
          <p>As an administrator, here are the full event details for your records:</p>
          <p><strong>Created by:</strong> ${event.createdBy ? `${event.createdBy.firstName || ""} ${event.createdBy.lastName || ""}`.trim() : "Unknown"}</p>
          <p><strong>Visibility:</strong> ${event.visibility || "team"}</p>
          <p><strong>Total attendees invited:</strong> ${event.attendees?.length || 0}</p>
          <p><strong>Category:</strong> ${event.category || "Not specified"}</p>
          ${event.recurring?.isRecurring ? `<p><strong>Recurring pattern:</strong> ${event.recurring.pattern}</p>` : ""}
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="${eventUrl}" class="button view-button">View Full Details</a>
          </div>
        </div>
        
        <p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
          You're receiving this as both an attendee and an administrator.
        </p>
      </div>
      
      <div class="footer">
        <p>© ${new Date().getFullYear()} Campaign Back Office</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get admin update notification template
 */
const getAdminUpdateTemplate = (
  event,
  user,
  action,
  changes,
  eventUrl,
  admin,
) => {
  const changeList =
    Object.keys(changes).length > 0
      ? Object.entries(changes)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join("")
      : "<li>No specific changes logged</li>";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #dc2626, #ef4444); color: white; padding: 20px; text-align: center; }
        .content { background: #ffffff; padding: 30px; }
        .changes { background: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .event-details { background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .admin-badge { background: #ef4444; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="admin-badge">ADMIN NOTIFICATION</div>
        <h2>Event ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
      </div>
      
      <div class="content">
        <p>Hello ${admin.firstName || "Admin"},</p>
        <p>An event has been <strong>${action}</strong> in the calendar.</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0; color: #1e40af;">${event.title}</h3>
          <p><strong>${action === "updated" ? "Updated by" : "Action by"}:</strong> ${user.firstName} ${user.lastName} (${user.role})</p>
          <p><strong>Time of action:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        ${
          action === "updated"
            ? `
          <div class="changes">
            <h4 style="margin-top: 0;">Changes Made:</h4>
            <ul>${changeList}</ul>
          </div>
        `
            : ""
        }
        
        <div class="event-details">
          <h4 style="margin-top: 0;">Current Event Details:</h4>
          <p><strong>When:</strong> ${new Date(event.startDate).toLocaleString()} - ${new Date(event.endDate).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.location || "TBD"}</p>
          <p><strong>Category:</strong> ${event.category || "Not specified"}</p>
          <p><strong>Attendees:</strong> ${event.attendees?.length || 0} invited</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${eventUrl}" class="button">View Event</a>
        </div>
      </div>
      
      <div class="footer">
        <p>This notification was sent to all campaign administrators.</p>
        <p>© ${new Date().getFullYear()} Campaign Back Office</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get admin deletion notification template
 */
const getAdminDeletionTemplate = (event, user, admin) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #6b7280, #4b5563); color: white; padding: 20px; text-align: center; }
        .content { background: #ffffff; padding: 30px; }
        .event-details { background: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .admin-badge { background: #ef4444; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="admin-badge">ADMIN NOTIFICATION</div>
        <h2>Event Deleted</h2>
      </div>
      
      <div class="content">
        <p>Hello ${admin.firstName || "Admin"},</p>
        <p>An event has been deleted from the calendar.</p>
        
        <div class="event-details">
          <h3 style="margin-top: 0; color: #4b5563;">${event.title}</h3>
          <p><strong>Deleted by:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Original time:</strong> ${new Date(event.startDate).toLocaleString()} - ${new Date(event.endDate).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.location || "TBD"}</p>
          <p><strong>Category:</strong> ${event.category || "Not specified"}</p>
          ${event.cancellationReason ? `<p><strong>Reason for deletion:</strong> ${event.cancellationReason}</p>` : ""}
        </div>
        
        <p style="margin-top: 20px; color: #6b7280;">
          This event has been permanently removed from all calendars and is no longer accessible.
        </p>
        
        <p><strong>Audit Information:</strong></p>
        <ul>
          <li>Event ID: ${event._id}</li>
          <li>Original creator: ${event.createdBy ? `${event.createdBy.firstName || ""} ${event.createdBy.lastName || ""}`.trim() : "Unknown"}</li>
          <li>Deletion time: ${new Date().toLocaleString()}</li>
        </ul>
      </div>
      
      <div class="footer">
        <p>This deletion notification was sent to all administrators.</p>
        <p>© ${new Date().getFullYear()} Campaign Back Office</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Get batch notification template
 */
const getBatchNotificationTemplate = (events, action, performedBy, admin) => {
  const eventList = events
    .map(
      (event) =>
        `<li><strong>${event.title}</strong> - ${new Date(event.startDate).toLocaleDateString()} (${event.location || "No location"})</li>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(to right, #7c3aed, #8b5cf6); color: white; padding: 20px; text-align: center; }
        .content { background: #ffffff; padding: 30px; }
        .event-list { background: #f3f4f6; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        .admin-badge { background: #ef4444; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="admin-badge">BATCH ADMIN NOTIFICATION</div>
        <h2>Batch Event ${action}</h2>
      </div>
      
      <div class="content">
        <p>Hello ${admin.firstName || "Admin"},</p>
        <p><strong>${events.length}</strong> events were ${action} by ${performedBy.firstName} ${performedBy.lastName}.</p>
        
        <div class="event-list">
          <h4 style="margin-top: 0; color: #4b5563;">Affected Events:</h4>
          <ul style="margin-bottom: 0;">${eventList}</ul>
        </div>
        
        <p><strong>Action time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Action performed by:</strong> ${performedBy.firstName} ${performedBy.lastName} (${performedBy.role})</p>
        
        <p style="margin-top: 20px;">Please review these changes in the calendar system and take any necessary actions.</p>
      </div>
      
      <div class="footer">
        <p>This batch notification was sent to all administrators.</p>
        <p>© ${new Date().getFullYear()} Campaign Back Office</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send invitations to attendees AND ALL ADMINS
 */
const sendInvitations = async (event, attendees, campaignId) => {
  const APP_URL = process.env.APP_URL || "http://localhost:3002";
  const eventUrl = `${APP_URL}/calendar/event/${event._id}`;

  console.log(`Sending invitations for event: ${event._id}`);

  // Get ALL admin-level users
  const allAdmins = await getAllAdminUsers(campaignId);
  console.log(`Found ${allAdmins.length} admins to notify`);

  // Get attendee user IDs for duplicate checking
  const attendeeUserIds = new Set();
  const attendeeDetails = [];

  // Process attendees
  for (const attendee of attendees) {
    try {
      const user = await User.findById(attendee.user);
      if (user && user.email) {
        attendeeUserIds.add(user._id.toString());
        attendeeDetails.push({
          user: user._id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        });
      }
    } catch (error) {
      console.error(`Error fetching attendee ${attendee.user}:`, error);
    }
  }

  // Send RSVP invitations to attendees
  console.log(`Sending RSVP emails to ${attendeeDetails.length} attendees`);
  for (const attendee of attendeeDetails) {
    try {
      await sendEmail(
        attendee.email,
        `Invitation: ${event.title}`,
        getInvitationEmailTemplate(event, eventUrl, attendee.name),
      );
      console.log(`✓ RSVP email sent to attendee: ${attendee.email}`);
    } catch (error) {
      console.error(`Failed to send invitation to ${attendee.email}:`, error);
    }
  }

  // Send admin notifications to ALL admins (including those who are attendees)
  console.log(`Sending admin notifications to ${allAdmins.length} admins`);
  for (const admin of allAdmins) {
    try {
      // Check if this admin is also an attendee
      const isAttendee = attendeeUserIds.has(admin._id.toString());

      // Customize email based on whether admin is also an attendee
      if (isAttendee) {
        // Admin is also an attendee - send a combined notification
        await sendEmail(
          admin.email,
          `[ADMIN] Event Invitation + Admin Notification: ${event.title}`,
          getCombinedAdminAttendeeTemplate(event, eventUrl, admin),
        );
        console.log(`✓ Combined email sent to admin-attendee: ${admin.email}`);
      } else {
        // Admin is not an attendee - send admin-only notification
        await sendEmail(
          admin.email,
          `[ADMIN NOTIFICATION] New Event Created: ${event.title}`,
          getAdminNotificationTemplate(event, eventUrl, admin),
        );
        console.log(`✓ Admin notification sent to: ${admin.email}`);
      }
    } catch (error) {
      console.error(
        `Failed to send admin notification to ${admin.email}:`,
        error,
      );
    }
  }

  console.log("✓ All invitations and admin notifications sent");
};

/**
 * Notify ALL admins of event updates
 */
const notifyAdminsOfEventUpdate = async (event, user, action, changes = {}) => {
  try {
    const allAdmins = await getAllAdminUsers(req.user.campaignId);
    const APP_URL = process.env.APP_URL || "http://localhost:3002";
    const eventUrl = `${APP_URL}/calendar/event/${event._id}`;

    console.log(`Notifying ${allAdmins.length} admins of event ${action}`);

    for (const admin of allAdmins) {
      await sendEmail(
        admin.email,
        `[ADMIN NOTIFICATION] Event ${action}: ${event.title}`,
        getAdminUpdateTemplate(event, user, action, changes, eventUrl, admin),
      );
      console.log(`✓ Admin ${action} notification sent to: ${admin.email}`);
    }
  } catch (error) {
    console.error("Failed to notify admins of event update:", error);
  }
};

/**
 * Notify ALL admins of event deletion
 */
const notifyAdminsOfEventDeletion = async (event, user) => {
  try {
    const allAdmins = await getAllAdminUsers(req.user.campaignId);

    for (const admin of allAdmins) {
      await sendEmail(
        admin.email,
        `[ADMIN NOTIFICATION] Event Deleted: ${event.title}`,
        getAdminDeletionTemplate(event, user, admin),
      );
      console.log(`✓ Admin deletion notification sent to: ${admin.email}`);
    }
  } catch (error) {
    console.error("Failed to notify admins of event deletion:", error);
  }
};

/**
 * Send batch notifications to all admins
 */
const notifyAllAdminsBatch = async (events, action, performedBy) => {
  try {
    const allAdmins = await getAllAdminUsers(req.user.campaignId);

    for (const admin of allAdmins) {
      await sendEmail(
        admin.email,
        `[ADMIN BATCH NOTIFICATION] ${events.length} Events ${action}`,
        getBatchNotificationTemplate(events, action, performedBy, admin),
      );
      console.log(`✓ Batch admin notification sent to: ${admin.email}`);
    }
  } catch (error) {
    console.error("Failed to send batch admin notifications:", error);
  }
};

/**
 * Helper function to update single event
 */
const updateSingleEvent = async (event, data, user) => {
  // Track changes for notification
  const changes = {};

  // Update fields
  const updatableFields = [
    "title",
    "description",
    "location",
    "mapLink",
    "startDate",
    "endDate",
    "allDay",
    "category",
    "customCategory",
    "visibility",
    "publicNotes",
    "privateNotes",
    "zoomLink",
    "status",
  ];

  updatableFields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== event[field]) {
      changes[field] = {
        old: event[field],
        new: data[field],
      };
      event[field] = data[field];
    }
  });

  // Update category color
  if (
    data.category &&
    CATEGORY_COLORS[data.category] &&
    CATEGORY_COLORS[data.category] !== event.categoryColor
  ) {
    changes.categoryColor = {
      old: event.categoryColor,
      new: CATEGORY_COLORS[data.category],
    };
    event.categoryColor = CATEGORY_COLORS[data.category];
  }

  // Handle attendees
  if (data.attendees) {
    const oldAttendees = event.attendees.map((a) => a.user.toString());
    const newAttendees = data.attendees;

    // Find new attendees
    const addedAttendees = newAttendees.filter(
      (id) => !oldAttendees.includes(id),
    );

    if (addedAttendees.length > 0) {
      changes.attendees = {
        old: oldAttendees.length,
        new: newAttendees.length,
        added: addedAttendees.length,
      };
    }

    event.attendees = newAttendees.map((userId) => ({
      user: userId,
      status: "pending",
    }));

    // Send invitations to new attendees
    if (addedAttendees.length > 0) {
      await sendInvitations(
        event,
        addedAttendees.map((id) => ({ user: id })),
      );
    }
  }

  event.updatedBy = user._id;
  await event.save();

  await event.populate("createdBy", "firstName lastName email");
  await event.populate("owner", "firstName lastName email");
  await event.populate("attendees.user", "firstName lastName email");

  // Notify admins of the update
  if (Object.keys(changes).length > 0) {
    await notifyAdminsOfEventUpdate(event, user, "updated", changes);
  }
};

/**
 * Update single occurrence of recurring event
 */
const updateSingleOccurrence = async (event, data, user) => {
  // Break the recurrence for this specific occurrence
  const newEventData = event.toObject();
  delete newEventData._id;
  delete newEventData.recurringEventId;

  // Update with new data
  Object.assign(newEventData, data);
  newEventData.recurring = {
    ...newEventData.recurring,
    isRecurring: false, // This becomes a standalone event
    originalSeriesId: event.recurringEventId || event._id,
  };
  newEventData.createdBy = user._id;
  newEventData.owner = user._id;

  const newEvent = new CalendarEvent(newEventData);
  await newEvent.save();

  // Optionally, mark the original occurrence as cancelled
  event.status = "cancelled";
  event.cancellationReason = "Replaced by edited occurrence";
  await event.save();

  // Notify admins
  await notifyAdminsOfEventUpdate(newEvent, user, "created (as standalone)");
};

/**
 * Update this and future occurrences
 */
const updateFutureOccurrences = async (event, data, user) => {
  const seriesId = event.recurringEventId || event._id;
  const startDate = event.startDate;

  // Find all future events in the series (including this one)
  const futureEvents = await CalendarEvent.find({
    $or: [{ _id: seriesId }, { recurringEventId: seriesId }],
    startDate: { $gte: startDate },
    status: { $ne: "cancelled" },
  }).sort({ startDate: 1 });

  if (futureEvents.length === 0) return;

  // For the first event (this one), we'll update it
  const firstEvent = futureEvents[0];

  // Update the recurring pattern for future events
  const newRecurring = {
    ...firstEvent.recurring,
    ...data.recurring,
  };

  // Delete all future events
  await CalendarEvent.deleteMany({
    _id: { $in: futureEvents.slice(1).map((e) => e._id) },
  });

  // Update the first event
  await updateSingleEvent(firstEvent, data, user);

  // Regenerate future events with new pattern
  if (newRecurring.isRecurring) {
    const occurrences = generateRecurringOccurrences(
      firstEvent.startDate,
      firstEvent.endDate,
      newRecurring,
    );

    // Skip the first occurrence (already exists)
    const eventPromises = occurrences.slice(1).map((occurrence) => {
      const occurrenceData = {
        ...firstEvent.toObject(),
        _id: undefined,
        startDate: occurrence.start,
        endDate: occurrence.end,
        recurringEventId: firstEvent._id,
        recurring: newRecurring,
        createdBy: user._id,
        owner: user._id,
      };

      const occurrenceEvent = new CalendarEvent(occurrenceData);
      return occurrenceEvent.save();
    });

    const savedEvents = await Promise.all(eventPromises);

    // Notify admins about the bulk update
    await notifyAllAdminsBatch(
      [firstEvent, ...savedEvents],
      "updated (future occurrences)",
      user,
    );
  }
};

/**
 * Update all occurrences in series
 */
const updateAllOccurrences = async (event, data, user) => {
  const seriesId = event.recurringEventId || event._id;

  // Find all events in the series
  const allEvents = await CalendarEvent.find({
    $or: [{ _id: seriesId }, { recurringEventId: seriesId }],
    status: { $ne: "cancelled" },
  }).sort({ startDate: 1 });

  if (allEvents.length === 0) return;

  // Get the first event (template)
  const templateEvent = allEvents[0];

  // Delete all events
  await CalendarEvent.deleteMany({
    _id: { $in: allEvents.map((e) => e._id) },
  });

  // Create new series with updated data
  const newEventData = {
    ...templateEvent.toObject(),
    ...data,
    _id: undefined,
    recurringEventId: undefined,
    createdBy: user._id,
    owner: user._id,
  };

  let savedEvents = [];

  if (data.recurring?.isRecurring) {
    // Generate new occurrences
    const occurrences = generateRecurringOccurrences(
      new Date(data.startDate || templateEvent.startDate),
      new Date(data.endDate || templateEvent.endDate),
      data.recurring,
    );

    const eventPromises = occurrences.map((occurrence) => {
      const occurrenceData = {
        ...newEventData,
        startDate: occurrence.start,
        endDate: occurrence.end,
      };

      const occurrenceEvent = new CalendarEvent(occurrenceData);
      return occurrenceEvent.save();
    });

    savedEvents = await Promise.all(eventPromises);

    // Link all events to the first one
    const firstEventId = savedEvents[0]._id;
    for (let i = 1; i < savedEvents.length; i++) {
      savedEvents[i].recurringEventId = firstEventId;
      await savedEvents[i].save();
    }
  } else {
    // Create single event
    const newEvent = new CalendarEvent(newEventData);
    await newEvent.save();
    savedEvents = [newEvent];
  }

  // Notify admins about the complete series update
  await notifyAllAdminsBatch(
    savedEvents,
    "completely updated (all occurrences)",
    user,
  );
};

/**
 * Generate ICS feed
 */
const generateICSFeed = async (events, calendarName = "Campaign Calendar") => {
  const cal = ical({
    name: calendarName,
    timezone: "America/New_York",
  });

  events.forEach((event) => {
    cal.createEvent({
      start: event.startDate,
      end: event.endDate,
      summary: `[${event.category}] ${event.title}`,
      description: event.description || "",
      location: event.location || "",
      url: `${process.env.APP_URL || "http://localhost:3002"}/calendar/event/${event._id}`,
      organizer: event.owner
        ? {
            name:
              `${event.owner.firstName || ""} ${event.owner.lastName || ""}`.trim() ||
              "Campaign",
            email: event.owner.email,
          }
        : undefined,
      attendees: event.attendees?.map((a) => ({
        email: a.user?.email,
        name: a.user
          ? `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim()
          : undefined,
        status: a.status === "accepted" ? "ACCEPTED" : "TENTATIVE",
      })),
    });
  });

  return cal.toString();
};

// ============================================
// User Search for Invites
// ============================================

/**
 * Search users for invites
 */
const searchUsers = async (req, res) => {
  try {
    const { q, role, excludeSelf } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const query = {
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      status: "active",
      campaign: req.user.campaignId,
    };

    // Filter by role
    if (role && role !== "all") {
      query.role = role;
    }

    // Exclude current user
    if (excludeSelf === "true" && req.user?.userId) {
      query._id = { $ne: req.user.userId };
    }

    const users = await User.find(query)
      .select("firstName lastName email role")
      .limit(20)
      .lean();

    res.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      })),
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ============================================
// Event Controllers
// ============================================

/**
 * Get events with filters
 */
const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      category,
      visibility,
      status,
      search,
      userId,
      myEvents,
    } = req.query;

    const query = {
      campaign: req.user.campaignId,
      $and: [],
    };

    // Search
    if (search) {
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      });
    }

    // User-specific
    if (userId) {
      query.$and.push({
        $or: [
          { createdBy: userId },
          { owner: userId },
          { "attendees.user": userId },
        ],
      });
    }

    // My events
    if (myEvents === "true") {
      query.$and.push({
        $or: [
          { createdBy: req.user.userId },
          { owner: req.user.userId },
          { "attendees.user": req.user.userId },
        ],
      });
    }

    // Date range filter
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Category filter
    if (category) query.category = category;

    // Status filter
    if (status) query.status = status;

    // Clean up if empty
    if (query.$and.length === 0) {
      delete query.$and;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await CalendarEvent.find(query)
      .populate("createdBy", "firstName lastName email role")
      .populate("owner", "firstName lastName email role")
      .populate("attendees.user", "firstName lastName email")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Filter by visibility permissions
    const visibleEvents = events.filter((event) => canViewEvent(event, user));

    const total = await CalendarEvent.countDocuments(query);

    res.json({
      success: true,
      events: visibleEvents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get events error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * Get events by date range (optimized for calendar views)
 */
const getEventsByDateRange = async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Start and end dates are required",
      });
    }

    const events = await CalendarEvent.find({
      $or: [
        // Events that start within range
        { startDate: { $gte: new Date(start), $lte: new Date(end) } },
        // Events that end within range
        { endDate: { $gte: new Date(start), $lte: new Date(end) } },
        // Events that span the entire range
        {
          startDate: { $lte: new Date(start) },
          endDate: { $gte: new Date(end) },
        },
      ],
      status: { $ne: "cancelled" },
      campaign: req.user.campaignId,
    })
      .populate("createdBy", "firstName lastName email role")
      .populate("owner", "firstName lastName email role")
      .populate("attendees.user", "firstName lastName email")
      .sort({ startDate: 1 })
      .lean();

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Filter by visibility permissions
    const visibleEvents = events.filter((event) => canViewEvent(event, user));

    // Format for FullCalendar or similar
    const formattedEvents = visibleEvents.map((event) => ({
      id: event._id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      allDay: event.allDay,
      color:
        CATEGORY_COLORS[event.category] || event.categoryColor || "#6B7280",
      extendedProps: {
        category: event.category,
        location: event.location,
        visibility: event.visibility,
        isTimeOff: event.isTimeOff,
        description: event.description,
        isCreator:
          event.createdBy?._id?.toString() === req.user.userId?.toString(),
        attendeeStatus: event.attendees?.find(
          (a) => a.user?._id?.toString() === req.user.userId?.toString(),
        )?.status,
        isRecurring: event.recurring?.isRecurring || false,
        recurring: event.recurring,
        recurringEventId: event.recurringEventId,
      },
    }));

    res.json({
      success: true,
      events: formattedEvents,
    });
  } catch (error) {
    console.error("Get events by date range error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get single event
 */
const getEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findById(req.params.id)
      .populate("createdBy", "firstName lastName email role")
      .populate("owner", "firstName lastName email role")
      .populate("attendees.user", "firstName lastName email role")
      .populate("updatedBy", "firstName lastName email")
      .populate("timeOffDetails.approvedBy", "firstName lastName email")
      .lean();

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Check visibility
    if (!canViewEvent(event, user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, event });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Create event (with recurring support)
 */
const createEvent = async (req, res) => {
  try {
    console.log("Creating event with user:", req.user);

    const {
      title,
      description,
      location,
      mapLink,
      startDate,
      endDate,
      allDay,
      category,
      customCategory,
      visibility,
      attendees,
      inviteGroups,
      reminders,
      recurring,
      publicNotes,
      privateNotes,
      isTimeOff,
      timeOffDetails,
      zoomLink,
    } = req.body;

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date, and end date are required",
      });
    }

    // Get user ID from req.user (from auth middleware)
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated properly",
      });
    }

    // Create base event data
    const eventData = {
      title,
      description,
      location,
      campaign: req.user.campaignId,
      mapLink,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allDay: allDay || false,
      category: category || "other",
      customCategory,
      categoryColor: CATEGORY_COLORS[category] || req.body.categoryColor,
      visibility: visibility || "team",
      createdBy: userId,
      owner: userId,
      attendees:
        attendees?.map((userId) => ({ user: userId, status: "pending" })) || [],
      reminders: reminders || [{ type: "email", time: 1440 }], // Default 24h reminder
      recurring,
      publicNotes,
      privateNotes,
      isTimeOff: isTimeOff || false,
      zoomLink,
    };

    // Handle time off
    if (isTimeOff && timeOffDetails) {
      eventData.timeOffDetails = {
        type: timeOffDetails.type,
        reason: timeOffDetails.reason,
        emergencyContact: timeOffDetails.emergencyContact,
        approvalStatus: "pending",
      };
    }

    // Handle recurring events
    if (recurring?.isRecurring) {
      // Validate weekly recurring has days selected
      if (
        recurring.pattern === "weekly" &&
        (!recurring.dayOfWeek || recurring.dayOfWeek.length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one day for weekly recurring event",
        });
      }

      const occurrences = generateRecurringOccurrences(
        new Date(startDate),
        new Date(endDate),
        recurring,
      );

      // Create first event
      const firstEvent = new CalendarEvent(eventData);
      await firstEvent.save();

      // Create subsequent events linked to the first
      const eventPromises = occurrences.slice(1).map((occurrence) => {
        const occurrenceData = {
          ...eventData,
          startDate: occurrence.start,
          endDate: occurrence.end,
          recurringEventId: firstEvent._id, // Link to first event
          recurring: {
            ...recurring,
            isRecurring: true,
          },
        };

        const occurrenceEvent = new CalendarEvent(occurrenceData);
        return occurrenceEvent.save();
      });

      const savedEvents = await Promise.all(eventPromises);
      const allEvents = [firstEvent, ...savedEvents];

      console.log(`Created ${allEvents.length} recurring events`);

      // Populate for response
      await firstEvent.populate("createdBy", "firstName lastName email");
      await firstEvent.populate("owner", "firstName lastName email");

      const campaignId = req.user.campaignId;

      console.log("this is the campaignId:", campaignId);
      console.log("this is the user:", req.user);

      // Send invitations to attendees for first event and notify admins
      if (attendees?.length > 0) {
        await sendInvitations(
          firstEvent,
          attendees.map((id) => ({ user: id })),
          req.user.campaignId,
        );
      } else {
        // Even if no attendees, notify admins
        await sendInvitations(firstEvent, []);
      }

      return res.status(201).json({
        success: true,
        message: "Recurring events created successfully",
        event: firstEvent,
        count: allEvents.length,
      });
    } else {
      // Create single event
      const event = new CalendarEvent(eventData);
      await event.save();
      console.log("Event created successfully:", event._id);

      // Populate for response
      await event.populate("createdBy", "firstName lastName email");
      await event.populate("owner", "firstName lastName email");

      // Send invitations to attendees and notify admins
      if (attendees?.length > 0) {
        await sendInvitations(
          event,
          attendees.map((id) => ({ user: id })),
        );
      } else {
        // Even if no attendees, notify admins
        await sendInvitations(event, []);
      }

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        event,
      });
    }
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Update event (with recurring support)
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { editMode } = req.query; // 'single', 'future', 'all'

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Check edit permission
    if (!canEditEvent(event, user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Handle recurring event updates
    if (event.recurring?.isRecurring && editMode) {
      switch (editMode) {
        case "single":
          // Update only this occurrence
          await updateSingleOccurrence(event, req.body, user);
          break;
        case "future":
          // Update this and all future occurrences
          await updateFutureOccurrences(event, req.body, user);
          break;
        case "all":
          // Update all occurrences in series
          await updateAllOccurrences(event, req.body, user);
          break;
        default:
          // Default to single if no mode specified
          await updateSingleOccurrence(event, req.body, user);
      }

      return res.json({
        success: true,
        message: `Event updated successfully (${editMode} mode)`,
      });
    }

    // Regular event update (non-recurring)
    await updateSingleEvent(event, req.body, user);

    res.json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete event (with recurring support)
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { editMode } = req.query; // 'single', 'future', 'all'

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Check permission (admin or creator)
    if (
      req.user.role !== "admin" &&
      event.createdBy.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Handle recurring event deletion
    if (event.recurring?.isRecurring && editMode) {
      switch (editMode) {
        case "single":
          // Delete only this occurrence
          event.status = "cancelled";
          event.cancellationReason = "Deleted by user";
          await event.save();
          await notifyAdminsOfEventDeletion(event, user);
          break;

        case "future":
          // Delete this and all future occurrences
          const seriesId = event.recurringEventId || event._id;
          const startDate = event.startDate;

          const futureEvents = await CalendarEvent.find({
            $or: [{ _id: seriesId }, { recurringEventId: seriesId }],
            startDate: { $gte: startDate },
          });

          await CalendarEvent.deleteMany({
            $or: [{ _id: seriesId }, { recurringEventId: seriesId }],
            startDate: { $gte: startDate },
          });

          await notifyAllAdminsBatch(
            futureEvents,
            "deleted (future occurrences)",
            user,
          );
          break;

        case "all":
          // Delete all occurrences in series
          const allSeriesId = event.recurringEventId || event._id;

          const allEvents = await CalendarEvent.find({
            $or: [{ _id: allSeriesId }, { recurringEventId: allSeriesId }],
          });

          await CalendarEvent.deleteMany({
            $or: [{ _id: allSeriesId }, { recurringEventId: allSeriesId }],
          });

          await notifyAllAdminsBatch(
            allEvents,
            "deleted (entire series)",
            user,
          );
          break;

        default:
          // Default to single
          event.status = "cancelled";
          event.cancellationReason = "Deleted by user";
          await event.save();
          await notifyAdminsOfEventDeletion(event, user);
      }
    } else {
      // Regular event deletion
      const deletedEvent = { ...event.toObject() };
      await event.deleteOne();
      await notifyAdminsOfEventDeletion(deletedEvent, user);
    }

    // Log the deletion for audit
    console.log(`Event ${event._id} deleted by user ${req.user.userId}`);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const events = await CalendarEvent.find({
      startDate: { $gte: new Date(), $lte: endDate },
      status: { $ne: "cancelled" },
      campaign: req.user.campaignId,
    })
      .populate("createdBy", "firstName lastName")
      .populate("owner", "firstName lastName")
      .sort({ startDate: 1 })
      .limit(parseInt(limit))
      .lean();

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Filter by visibility
    const visibleEvents = events.filter((event) => canViewEvent(event, user));

    // Group by date
    const grouped = {};
    visibleEvents.forEach((event) => {
      const date = event.startDate.toISOString().split("T")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(event);
    });

    res.json({
      success: true,
      events: visibleEvents,
      grouped,
      count: visibleEvents.length,
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get out of office entries
 */
const getOutOfOffice = async (req, res) => {
  try {
    const { start, end } = req.query;

    const query = {
      isTimeOff: true,
      "timeOffDetails.approvalStatus": "approved",
      campaign: req.user.campaignId,
    };

    if (start && end) {
      query.startDate = { $gte: new Date(start), $lte: new Date(end) };
    }

    const timeOff = await CalendarEvent.find(query)
      .populate("owner", "firstName lastName email role")
      .populate("timeOffDetails.approvedBy", "firstName lastName")
      .sort({ startDate: 1 })
      .lean();

    // Filter based on visibility
    const visibleTimeOff = timeOff.filter((entry) => {
      // Management can see all details
      if (["admin", "manager"].includes(req.user.role)) return true;

      // Others only see basic "Out of Office"
      return true;
    });

    // Format for display
    const formatted = visibleTimeOff.map((entry) => ({
      id: entry._id,
      user: entry.owner,
      startDate: entry.startDate,
      endDate: entry.endDate,
      type: entry.timeOffDetails?.type,
      // Only show reason to management
      reason: ["admin", "manager"].includes(req.user.role)
        ? entry.timeOffDetails?.reason
        : undefined,
      // Show generic title to others
      title: ["admin", "manager"].includes(req.user.role)
        ? `${entry.owner?.firstName || ""} ${entry.owner?.lastName || ""} - ${entry.timeOffDetails?.type || "Out of Office"}`
        : `${entry.owner?.firstName || ""} ${entry.owner?.lastName || ""} - Out of Office`,
    }));

    res.json({
      success: true,
      timeOff: formatted,
    });
  } catch (error) {
    console.error("Get out of office error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update attendee status (RSVP)
 */
const updateAttendeeStatus = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { status, notes } = req.body;

    // Verify user is updating their own status or is admin
    if (userId !== req.user.userId.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const attendee = event.attendees.find(
      (a) => a.user && a.user.toString() === userId,
    );

    if (!attendee) {
      return res
        .status(404)
        .json({ success: false, message: "Attendee not found" });
    }

    const oldStatus = attendee.status;
    attendee.status = status || "accepted";
    attendee.respondedAt = new Date();
    if (notes) attendee.notes = notes;

    await event.save();

    // Notify admins of RSVP change
    const user = await User.findById(userId);
    const changes = {
      attendee_status: {
        user: `${user.firstName} ${user.lastName}`,
        old: oldStatus,
        new: attendee.status,
      },
    };
    await notifyAdminsOfEventUpdate(event, user, "RSVP updated", changes);

    res.json({
      success: true,
      message: `RSVP status updated to ${attendee.status}`,
      attendee,
    });
  } catch (error) {
    console.error("Update attendee status error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Add reminder to event
 */
const addReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, time } = req.body;

    if (!type || !time) {
      return res.status(400).json({
        success: false,
        message: "Reminder type and time are required",
      });
    }

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check if user is attendee or owner
    const isAttendee = event.attendees.some(
      (a) => a.user && a.user.toString() === req.user.userId.toString(),
    );

    if (
      !isAttendee &&
      event.owner.toString() !== req.user.userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    event.reminders.push({
      type,
      time: parseInt(time),
      sent: false,
    });

    await event.save();

    // Notify admins
    const user = await User.findById(req.user.userId);
    const changes = {
      reminder_added: {
        type,
        time: `${time} minutes`,
      },
    };
    await notifyAdminsOfEventUpdate(event, user, "reminder added", changes);

    res.json({
      success: true,
      message: "Reminder added successfully",
      reminders: event.reminders,
    });
  } catch (error) {
    console.error("Add reminder error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get calendar feed (ICS)
 */
const getCalendarFeed = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by token
    const user = await User.findOne({ calendarFeedToken: token });

    let query = {
      visibility: { $in: ["public", "team"] },
      status: { $ne: "cancelled" },
      startDate: {
        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      },
      campaign: req.user.campaignId,
    };

    // If user found, include their personal events
    if (user) {
      query = {
        $or: [
          { visibility: { $in: ["public", "team"] } },
          { createdBy: user._id },
          { owner: user._id },
          { "attendees.user": user._id },
        ],
        status: { $ne: "cancelled" },
        startDate: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      };
    }

    const events = await CalendarEvent.find(query)
      .populate("owner", "firstName lastName email")
      .limit(100)
      .lean();

    const ics = await generateICSFeed(
      events,
      user ? `${user.firstName}'s Calendar` : "Campaign Calendar",
    );

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", "attachment; filename=calendar.ics");
    res.send(ics);
  } catch (error) {
    console.error("Get calendar feed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get personalized calendar feed
 */
const getPersonalizedFeed = async (req, res) => {
  try {
    // Generate unique token for user if not exists
    let user = await User.findById(req.user.userId);

    if (!user.calendarFeedToken) {
      user.calendarFeedToken = crypto.randomBytes(32).toString("hex");
      await user.save();
    }

    const APP_URL = process.env.APP_URL || "http://localhost:3002";
    const feedUrl = `${APP_URL}/api/calendar/feed/${user.calendarFeedToken}`;

    res.json({
      success: true,
      feedUrl,
      icsUrl: feedUrl,
      instructions:
        "Copy this URL into Google Calendar, Apple Calendar, or Outlook to subscribe",
    });
  } catch (error) {
    console.error("Get personalized feed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Export events (CSV/PDF)
 */
const exportEvents = async (req, res) => {
  try {
    const { format = "csv", start, end } = req.query;

    const query = {
      campaign: req.user.campaignId,
    };

    if (start && end) {
      query.startDate = { $gte: new Date(start), $lte: new Date(end) };
    }

    const events = await CalendarEvent.find(query)
      .populate("owner", "firstName lastName email")
      .populate("attendees.user", "firstName lastName email")
      .sort({ startDate: 1 })
      .lean();

    // Create user object for permission checks
    const user = {
      _id: req.user.userId,
      role: req.user.role,
    };

    // Filter visible events
    const visibleEvents = events.filter((event) => canViewEvent(event, user));

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Title",
        "Start Date",
        "End Date",
        "Category",
        "Location",
        "Owner",
        "Visibility",
        "Status",
        "Recurring",
        "Attendees",
        "Description",
      ];
      const rows = visibleEvents.map((event) => [
        event.title,
        new Date(event.startDate).toLocaleString(),
        new Date(event.endDate).toLocaleString(),
        event.category,
        event.location || "",
        event.owner
          ? `${event.owner.firstName || ""} ${event.owner.lastName || ""}`.trim()
          : "",
        event.visibility,
        event.status,
        event.recurring?.isRecurring ? event.recurring.pattern : "No",
        event.attendees?.length || 0,
        (event.description || "").replace(/,/g, ";"), // Escape commas
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=calendar_export_${new Date().toISOString().split("T")[0]}.csv`,
      );
      return res.send(csvContent);
    }

    // Default JSON response
    res.json({
      success: true,
      events: visibleEvents,
      count: visibleEvents.length,
    });
  } catch (error) {
    console.error("Export events error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================
// Category Controllers
// ============================================

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
  try {
    let categories = await CalendarCategory.find({
      campaign: req.user.campaignId,
    }).sort({ order: 1 });

    // If no categories exist, create defaults
    if (categories.length === 0) {
      const defaultCategories = CalendarCategory.getDefaultCategories().map(
        (cat) => ({
          ...cat,
          campaign: req.user.campaignId, // ✅ attach campaign
        }),
      );
      categories = await CalendarCategory.insertMany(defaultCategories);
    }

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Create category
 */
const createCategory = async (req, res) => {
  try {
    const { name, displayName, color, icon, description, allowedRoles, order } =
      req.body;

    // Check if category exists
    const existing = await CalendarCategory.findOne({
      name,
      campaign: req.user.campaignId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = new CalendarCategory({
      name,
      displayName,
      color,
      icon,
      campaign: req.user.campaignId,
      description,
      allowedRoles,
      order: order || 0,
      createdBy: req.user.userId,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update category
 */
const updateCategory = async (req, res) => {
  try {
    const category = await CalendarCategory.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Don't allow editing default categories' names
    if (
      category.isDefault &&
      req.body.name &&
      req.body.name !== category.name
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot rename default categories",
      });
    }

    const updatableFields = [
      "displayName",
      "color",
      "icon",
      "description",
      "allowedRoles",
      "order",
    ];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete category
 */
const deleteCategory = async (req, res) => {
  try {
    const category = await CalendarCategory.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete default categories",
      });
    }

    // Update events using this category to "other"
    await CalendarEvent.updateMany(
      { category: category.name },
      { category: "other", categoryColor: CATEGORY_COLORS.other },
    );

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ============================================
// Time Off Controllers
// ============================================

/**
 * Get time off requests (for management)
 */
const getTimeOffRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    const timeOffRequests = await CalendarEvent.find({
      isTimeOff: true,
      "timeOffDetails.approvalStatus": status,
      campaign: req.user.campaignId,
    })
      .populate("owner", "firstName lastName email role")
      .populate("createdBy", "firstName lastName")
      .sort({ startDate: 1 })
      .lean();

    res.json({
      success: true,
      requests: timeOffRequests,
    });
  } catch (error) {
    console.error("Get time off requests error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Approve/deny time off
 */
const approveTimeOff = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    const event = await CalendarEvent.findById(id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (!event.isTimeOff) {
      return res.status(400).json({
        success: false,
        message: "This is not a time off request",
      });
    }

    const oldStatus = event.timeOffDetails.approvalStatus;
    event.timeOffDetails.approvalStatus = approved ? "approved" : "denied";
    event.timeOffDetails.approvedBy = req.user.userId;
    event.timeOffDetails.approvedAt = new Date();

    if (reason) {
      event.timeOffDetails.reason = reason;
    }

    // If approved, make it visible to team
    if (approved) {
      event.visibility = "team";
      event.title = `${event.owner.firstName || ""} ${event.owner.lastName || ""} - Out of Office`;
    }

    await event.save();

    // Notify the user
    const user = await User.findById(event.owner);
    if (user && user.email) {
      await sendEmail(
        user.email,
        `Time Off Request ${approved ? "Approved" : "Denied"}`,
        `
          <h2>Time Off Request ${approved ? "Approved" : "Denied"}</h2>
          <p>Your time off request from ${new Date(event.startDate).toLocaleDateString()} to ${new Date(event.endDate).toLocaleDateString()} has been ${approved ? "approved" : "denied"}.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        `,
      );
    }

    // Notify all admins of the time off decision
    const adminUser = await User.findById(req.user.userId);
    const changes = {
      time_off_status: {
        old: oldStatus,
        new: event.timeOffDetails.approvalStatus,
        user: `${user.firstName} ${user.lastName}`,
      },
    };
    await notifyAdminsOfEventUpdate(
      event,
      adminUser,
      "time off " + event.timeOffDetails.approvalStatus,
      changes,
    );

    res.json({
      success: true,
      message: `Time off request ${approved ? "approved" : "denied"} successfully`,
      event,
    });
  } catch (error) {
    console.error("Approve time off error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get event statistics
 */
const getEventStats = async (req, res) => {
  try {
    const { start, end, userId } = req.query;

    const matchStage = {
      campaign: req.user.campaignId,
    };

    if (start && end) {
      matchStage.startDate = { $gte: new Date(start), $lte: new Date(end) };
    }

    if (userId) {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const stats = await CalendarEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          meetings: {
            $sum: { $cond: [{ $eq: ["$category", "meeting"] }, 1, 0] },
          },
          events: { $sum: { $cond: [{ $eq: ["$category", "event"] }, 1, 0] } },
          canvassing: {
            $sum: { $cond: [{ $eq: ["$category", "canvassing"] }, 1, 0] },
          },
          phoneBanking: {
            $sum: { $cond: [{ $eq: ["$category", "phone_banking"] }, 1, 0] },
          },
          fundraisers: {
            $sum: { $cond: [{ $eq: ["$category", "fundraiser"] }, 1, 0] },
          },
          timeOff: { $sum: { $cond: ["$isTimeOff", 1, 0] } },
          avgDuration: { $avg: { $subtract: ["$endDate", "$startDate"] } },
        },
      },
    ]);

    const categoryStats = await CalendarEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalEvents: 0,
        meetings: 0,
        events: 0,
        canvassing: 0,
        phoneBanking: 0,
        fundraisers: 0,
        timeOff: 0,
      },
      byCategory: categoryStats,
    });
  } catch (error) {
    console.error("Get event stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  searchUsers,
  getEvents,
  getEventsByDateRange,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
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
};
