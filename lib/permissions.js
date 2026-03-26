// lib/permissions.js
// Role-based access control utility based on the PDF

// Define role hierarchy and permissions
const ROLE_HIERARCHY = {
  // Admin. Total access
  admin: 100,
  // Level 1 - Executive / Leadership (Full Access)
  client_admin: 95,
  candidate: 95,
  campaign_manager: 95,
  deputy_campaign_manager: 95,
  campaign_chair: 95,
  chief_of_staff: 95,
  state_director: 95,
  regional_director: 95,
  field_director: 95,
  compliance_officer: 95,
  senior_advisor: 95,

  // Level 2 - Oversight Access
  scheduler: 80,
  legal: 80,

  // Level 3 - Finance Access
  finance_director: 90,
  fundraiser: 70,
  finance_assistant: 70,
  call_time_manager: 70,
  donor_researcher: 70,
  event_fundraising_coordinator: 70,

  // Level 4 - Media & Communications
  media_director: 75,
  communications_director: 75,
  press_secretary: 70,
  digital_director: 70,
  social_media_manager: 65,
  content_creator: 65,
  graphic_designer: 65,
  videographer: 65,
  rapid_response_director: 70,
  speechwriter: 65,

  // Level 5 - Field Operations
  field_director_ops: 85,
  deputy_field_director: 80,
  regional_field_coordinator: 75,
  precinct_captain: 70,
  data_director: 80,
  voter_file_manager: 75,
  volunteer_coordinator: 70,
  gotv_director: 75,
  ballot_chase_director: 75,
  text_bank_team: 60,

  // Limited Access
  volunteer: 40,
  canvasser: 40,
  phone_banker: 40,
};

// Define role groups for easy reference
export const ROLE_GROUPS = {
  EXECUTIVE: [
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
  ],
  OVERSIGHT: ["scheduler", "legal"],
  FINANCE: [
    "finance_director",
    "fundraiser",
    "finance_assistant",
    "call_time_manager",
    "donor_researcher",
    "event_fundraising_coordinator",
  ],
  MEDIA: [
    "media_director",
    "communications_director",
    "press_secretary",
    "digital_director",
    "social_media_manager",
    "content_creator",
    "graphic_designer",
    "videographer",
    "rapid_response_director",
    "speechwriter",
  ],
  FIELD: [
    "field_director_ops",
    "deputy_field_director",
    "regional_field_coordinator",
    "precinct_captain",
    "data_director",
    "voter_file_manager",
    "volunteer_coordinator",
    "gotv_director",
    "ballot_chase_director",
    "text_bank_team",
    "canvasser",
    "phone_banker",
  ],
  LIMITED: ["volunteer", "canvasser", "phone_banker"],
};

// Permission definitions based on PDF
export const PERMISSIONS = {
  // User Management
  CAN_ADD_DELETE_USERS: (role) => ROLE_GROUPS.EXECUTIVE.includes(role),
  CAN_ASSIGN_ROLES: (role) => ROLE_GROUPS.EXECUTIVE.includes(role),
  CAN_EDIT_USERS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || role === "manager",

  // System Access
  HAS_FULL_SYSTEM_ACCESS: (role) => ROLE_GROUPS.EXECUTIVE.includes(role),
  HAS_OVERSIGHT_ACCESS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role),

  // Premium Features
  CAN_ACCESS_PREMIUM: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    role === "finance_director" ||
    role === "media_director" ||
    role === "field_director_ops",

  // Financial Access
  CAN_VIEW_FINANCE: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role) ||
    ROLE_GROUPS.FINANCE.includes(role),

  CAN_EDIT_FINANCE: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || ROLE_GROUPS.FINANCE.includes(role),

  CAN_ADD_DONATIONS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || ROLE_GROUPS.FINANCE.includes(role),

  CAN_VIEW_DONOR_DATABASE: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role) ||
    ROLE_GROUPS.FINANCE.includes(role),

  // Voter Data Access
  CAN_VIEW_VOTER_DATA: (role) =>
    !["legal"].includes(role) || // Legal can view
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.FIELD.includes(role) ||
    ROLE_GROUPS.MEDIA.includes(role) ||
    ROLE_GROUPS.FINANCE.includes(role) ||
    ROLE_GROUPS.LIMITED.includes(role),

  CAN_EDIT_VOTER_DATA: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ["data_director", "voter_file_manager"].includes(role),

  CAN_EXPORT_VOTER_DATA: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ["data_director", "voter_file_manager"].includes(role),

  // Media Access
  CAN_VIEW_MEDIA: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role) ||
    ROLE_GROUPS.MEDIA.includes(role) ||
    ROLE_GROUPS.LIMITED.includes(role),

  CAN_UPLOAD_MEDIA: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || ROLE_GROUPS.MEDIA.includes(role),

  // Forms Access
  CAN_VIEW_FORMS: (role) => true, // Everyone can view forms
  CAN_UPLOAD_FORMS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || ROLE_GROUPS.MEDIA.includes(role),

  // Field Operations
  CAN_VIEW_VOLUNTEERS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) || ROLE_GROUPS.FIELD.includes(role),

  CAN_MANAGE_VOLUNTEERS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ["volunteer_coordinator", "field_director_ops"].includes(role),

  CAN_ACCESS_PHONE_BANK: (role) =>
    ROLE_GROUPS.FIELD.includes(role) ||
    ["phone_banker", "canvasser", "volunteer"].includes(role),

  CAN_ACCESS_TEXT_MESSAGING: (role) =>
    ROLE_GROUPS.FIELD.includes(role) ||
    ["text_bank_team", "phone_banker"].includes(role),

  // Calendar Access
  CAN_VIEW_CALENDAR: (role) => true, // Everyone can view calendar
  CAN_CREATE_EVENTS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role) ||
    ["scheduler"].includes(role),

  CAN_VIEW_MANAGEMENT_ONLY_EVENTS: (role) =>
    ROLE_GROUPS.EXECUTIVE.includes(role) ||
    ROLE_GROUPS.OVERSIGHT.includes(role),

  // Settings Access
  CAN_CHANGE_SETTINGS: (role) => ROLE_GROUPS.EXECUTIVE.includes(role),

  // Management Directory - Everyone can view
  CAN_VIEW_MANAGEMENT_DIRECTORY: () => true,
};

// Get readable role name for display
export const getRoleDisplayName = (role) => {
  const roleNames = {
    client_admin: "Administrator",
    candidate: "Candidate",
    campaign_manager: "Campaign Manager",
    deputy_campaign_manager: "Deputy Campaign Manager",
    campaign_chair: "Campaign Chair",
    chief_of_staff: "Chief of Staff",
    state_director: "State Director",
    regional_director: "Regional Director",
    field_director: "Field Director",
    compliance_officer: "Compliance Officer",
    senior_advisor: "Senior Advisor",
    scheduler: "Scheduler / Event Coordinator",
    legal: "Legal",
    finance_director: "Finance Director",
    fundraiser: "Fundraiser",
    finance_assistant: "Finance Assistant",
    call_time_manager: "Call Time Manager",
    donor_researcher: "Donor Researcher",
    event_fundraising_coordinator: "Event Fundraising Coordinator",
    media_director: "Media Director",
    communications_director: "Communications Director",
    press_secretary: "Press Secretary",
    digital_director: "Digital Director",
    social_media_manager: "Social Media Manager",
    content_creator: "Content Creator",
    graphic_designer: "Graphic Designer",
    videographer: "Videographer / Photographer",
    rapid_response_director: "Rapid Response Director",
    speechwriter: "Speechwriter",
    field_director_ops: "Field Director (Ops)",
    deputy_field_director: "Deputy Field Director",
    regional_field_coordinator: "Regional Field Coordinator",
    precinct_captain: "Precinct Captain",
    data_director: "Data Director",
    voter_file_manager: "Voter File Manager",
    volunteer_coordinator: "Volunteer Coordinator",
    gotv_director: "GOTV Director",
    ballot_chase_director: "Ballot Chase Director",
    text_bank_team: "Text Bank Team",
    volunteer: "Volunteer",
    canvasser: "Canvasser",
    phone_banker: "Phone Banker",
  };

  return (
    roleNames[role] ||
    role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// Get role level
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

// Check if user has minimum role level
export const hasMinLevel = (userRole, requiredLevel) => {
  return getRoleLevel(userRole) >= requiredLevel;
};

// Get department from role
export const getDepartmentFromRole = (role) => {
  if (ROLE_GROUPS.EXECUTIVE.includes(role)) return "Executive Leadership";
  if (ROLE_GROUPS.OVERSIGHT.includes(role)) return "Legal & Compliance";
  if (ROLE_GROUPS.FINANCE.includes(role)) return "Finance";
  if (ROLE_GROUPS.MEDIA.includes(role)) return "Media & Communications";
  if (ROLE_GROUPS.FIELD.includes(role)) return "Field Operations";
  return "Volunteer";
};
