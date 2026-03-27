"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Users,
  Clock,
  MapPin,
  Video,
  X,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Globe,
  UserPlus,
  Bell,
  Heart,
  Umbrella,
  Mic,
  Mic2,
  DollarSign,
  DoorOpen,
  Phone,
  Handshake,
  Newspaper,
  MoreHorizontal,
  Trash2,
  AlertTriangle,
  Repeat,
} from "lucide-react";
import { apiRequest, validateSession } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/dasboard1/Header";
import { useSidebar } from "@/context/SidebarContext";

// Category icons mapping
const CATEGORY_ICONS = {
  meeting: Users,
  vacation: Umbrella,
  medical: Heart,
  event: CalendarIcon,
  debate: Mic2,
  public_speaking: Mic,
  fundraiser: DollarSign,
  canvassing: DoorOpen,
  phone_banking: Phone,
  donor_meeting: Handshake,
  press_media: Newspaper,
  other: MoreHorizontal,
};

// Category colors mapping
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

// Visibility icons
const VISIBILITY_ICONS = {
  public: Globe,
  team: Users,
  management: Lock,
  private: EyeOff,
  invite_only: UserPlus,
};

export default function CalendarView() {
  const router = useRouter();
  const { setIsOpen } = useSidebar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week, day
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    visibility: [],
    showTimeOff: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [outOfOffice, setOutOfOffice] = useState([]);
  const [user, setUser] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Recurring edit choice state
  const [showRecurringChoice, setShowRecurringChoice] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'single', 'future', 'all'

  // Invite search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    allDay: false,
    category: "meeting",
    visibility: "team",
    attendees: [],
    reminders: [{ type: "email", time: 1440 }],
    isTimeOff: false,
    timeOffDetails: null,
    zoomLink: "",
    recurring: {
      isRecurring: false,
      pattern: "weekly",
      interval: 1,
      endDate: null,
      occurrences: null,
      dayOfWeek: [],
      dayOfMonth: null,
      monthOfYear: null,
    },
  });

  // Load events when date or view changes
  useEffect(() => {
    loadEvents();
    loadCategories();
    loadStats();
    loadUpcomingEvents();
    loadOutOfOffice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view, filters]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load user details when attendees change
  useEffect(() => {
    if (formData.attendees.length > 0) {
      Promise.all(
        formData.attendees.map((id) =>
          apiRequest(`/users/${id}`).catch(() => null),
        ),
      ).then((users) => {
        setSelectedUsers(users.filter((u) => u?.success).map((u) => u.user));
      });
    } else {
      setSelectedUsers([]);
    }
  }, [formData.attendees]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const start = getStartDate();
      const end = getEndDate();

      const response = await apiRequest(
        `/calendar/range?start=${start.toISOString()}&end=${end.toISOString()}`,
      );

      if (response.success) {
        setEvents(response.events);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiRequest("/calendar/categories/all");
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadStats = async () => {
    try {
      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      const response = await apiRequest(
        `/calendar/stats?start=${start.toISOString()}&end=${end.toISOString()}`,
      );

      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const response = await apiRequest("/calendar/upcoming?days=7&limit=5");
      if (response.success) {
        setUpcomingEvents(response.events);
      }
    } catch (error) {
      console.error("Error loading upcoming events:", error);
    }
  };

  const loadOutOfOffice = async () => {
    try {
      const response = await apiRequest("/calendar/out-of-office");
      if (response.success) {
        setOutOfOffice(response.timeOff);
      }
    } catch (error) {
      console.error("Error loading out of office:", error);
    }
  };

  const searchUsers = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiRequest(
        `/calendar/users/search?q=${encodeURIComponent(term)}&excludeSelf=true`,
      );
      if (response.success) {
        setSearchResults(response.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const addAttendee = (user) => {
    if (!formData.attendees.includes(user._id)) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, user._id],
      });
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeAttendee = (userId) => {
    setFormData({
      ...formData,
      attendees: formData.attendees.filter((id) => id !== userId),
    });
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    switch (view) {
      case "month":
        date.setDate(1);
        break;
      case "week":
        date.setDate(date.getDate() - date.getDay());
        break;
      case "day":
        // Keep as is
        break;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getEndDate = () => {
    const date = new Date(getStartDate());
    switch (view) {
      case "month":
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        break;
      case "week":
        date.setDate(date.getDate() + 6);
        break;
      case "day":
        date.setDate(date.getDate() + 1);
        break;
    }
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "month":
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() - 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "month":
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case "week":
        newDate.setDate(newDate.getDate() + 7);
        break;
      case "day":
        newDate.setDate(newDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setEditMode(null);
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);

    setFormData({
      title: "",
      description: "",
      location: "",
      startDate: now.toISOString().slice(0, 16),
      endDate: oneHourLater.toISOString().slice(0, 16),
      allDay: false,
      category: "meeting",
      visibility: "team",
      attendees: [],
      reminders: [{ type: "email", time: 1440 }],
      isTimeOff: false,
      timeOffDetails: null,
      zoomLink: "",
      recurring: {
        isRecurring: false,
        pattern: "weekly",
        interval: 1,
        endDate: null,
        occurrences: null,
        dayOfWeek: [],
        dayOfMonth: null,
        monthOfYear: null,
      },
    });
    setSelectedUsers([]);
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);

    // Check if it's a recurring event
    if (event.extendedProps?.isRecurring) {
      setShowRecurringChoice(true);
      // Store the event data for later
      setFormData({
        title: event.title,
        description: event.extendedProps?.description || "",
        location: event.extendedProps?.location || "",
        startDate: new Date(event.start).toISOString().slice(0, 16),
        endDate: new Date(event.end).toISOString().slice(0, 16),
        allDay: event.allDay || false,
        category: event.extendedProps?.category || "meeting",
        visibility: event.extendedProps?.visibility || "team",
        attendees: [],
        reminders: [{ type: "email", time: 1440 }],
        isTimeOff: false,
        timeOffDetails: null,
        zoomLink: "",
        recurring: event.extendedProps?.recurring || {
          isRecurring: true,
          pattern: "weekly",
          interval: 1,
          dayOfWeek: event.extendedProps?.recurring?.dayOfWeek || [],
        },
      });
    } else {
      // Normal event edit
      setFormData({
        title: event.title,
        description: event.extendedProps?.description || "",
        location: event.extendedProps?.location || "",
        startDate: new Date(event.start).toISOString().slice(0, 16),
        endDate: new Date(event.end).toISOString().slice(0, 16),
        allDay: event.allDay || false,
        category: event.extendedProps?.category || "meeting",
        visibility: event.extendedProps?.visibility || "team",
        attendees: [],
        reminders: [{ type: "email", time: 1440 }],
        isTimeOff: false,
        timeOffDetails: null,
        zoomLink: "",
        recurring: { isRecurring: false },
      });
      setShowEventModal(true);
    }
  };

  const handleRecurringChoice = (choice) => {
    setEditMode(choice);
    setShowRecurringChoice(false);
    setShowEventModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = selectedEvent ? `/calendar/${selectedEvent.id}` : "/calendar";
      let method = selectedEvent ? "PUT" : "POST";

      // Add recurring edit parameters if needed
      if (selectedEvent && editMode) {
        url += `?editMode=${editMode}`;
      }

      const response = await apiRequest(url, {
        method,
        body: formData,
      });

      if (response.success) {
        setShowEventModal(false);
        setEditMode(null);
        loadEvents();
        loadStats();
        loadUpcomingEvents();
        loadOutOfOffice();
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    }
  };

  const handleDeleteClick = (event, e) => {
    e.stopPropagation();
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setDeleting(true);
    try {
      await apiRequest(`/calendar/${eventToDelete.id}`, {
        method: "DELETE",
      });

      // Refresh data
      loadEvents();
      loadStats();
      loadUpcomingEvents();
      loadOutOfOffice();

      setShowDeleteConfirm(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      const response = await apiRequest(
        `/calendar/${eventId}/attendees/${user.id}`,
        {
          method: "PUT",
          body: { status },
        },
      );

      if (response.success) {
        loadEvents();
        alert(`RSVP status updated to ${status}`);
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP");
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiRequest("/calendar/export?format=csv");

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calendar_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      alert("Failed to export calendar");
    }
  };

  const renderMonthView = () => {
    const startDate = getStartDate();
    const daysInMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      0,
    ).getDate();
    const startDay = startDate.getDay();
    const weeks = Math.ceil((daysInMonth + startDay) / 7);
    const days = [];

    for (let i = 0; i < weeks * 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i - startDay);
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start);
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });

      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === startDate.getMonth(),
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`bg-white min-h-[100px] p-2 ${
              !day.isCurrentMonth ? "opacity-50" : ""
            } ${day.isToday ? "bg-blue-50" : ""}`}
            onClick={() => {
              const date = new Date(day.date);
              date.setHours(12);
              setFormData({
                ...formData,
                startDate: date.toISOString().slice(0, 16),
                endDate: new Date(date.getTime() + 3600000)
                  .toISOString()
                  .slice(0, 16),
              });
              setShowEventModal(true);
            }}
          >
            <div className="font-medium text-sm mb-1">{day.date.getDate()}</div>
            <div className="space-y-1">
              {day.events.slice(0, 2).map((event) => (
                <div key={event.id} className="group relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className="w-full text-left text-xs p-1 rounded truncate pr-6"
                    style={{
                      backgroundColor: event.color + "20",
                      color: event.color,
                    }}
                  >
                    {event.extendedProps?.isRecurring && (
                      <Repeat className="h-3 w-3 inline mr-1" />
                    )}
                    {event.title}
                  </button>
                  {/* Delete button for events */}
                  {(user?.role === "admin" ||
                    event.extendedProps?.isCreator) && (
                    <button
                      onClick={(e) => handleDeleteClick(event, e)}
                      className="absolute right-0 top-0 hidden group-hover:block p-1 text-red-500 hover:text-red-700"
                      title="Delete event"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {day.events.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{day.events.length - 2} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getStartDate();
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            <div className="bg-gray-50 p-2"></div>
            {days.map((day, i) => (
              <div
                key={i}
                className={`bg-gray-50 p-2 text-center ${
                  day.toDateString() === new Date().toDateString()
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="font-medium">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-sm">{day.getDate()}</div>
              </div>
            ))}

            {hours.map((hour) => (
              <div key={`hour-${hour}`} className="contents">
                <div className="bg-white p-2 text-xs text-right">
                  {hour % 12 || 12} {hour < 12 ? "AM" : "PM"}
                </div>
                {days.map((day, dayIndex) => {
                  const hourEvents = events.filter((event) => {
                    const eventDate = new Date(event.start);
                    return (
                      eventDate.getDate() === day.getDate() &&
                      eventDate.getMonth() === day.getMonth() &&
                      eventDate.getFullYear() === day.getFullYear() &&
                      eventDate.getHours() === hour
                    );
                  });

                  return (
                    <div
                      key={`${hour}-${dayIndex}`}
                      className="bg-white p-1 border-t min-h-[40px] cursor-pointer hover:bg-gray-50 relative group"
                      onClick={() => {
                        const date = new Date(day);
                        date.setHours(hour);
                        setFormData({
                          ...formData,
                          startDate: date.toISOString().slice(0, 16),
                          endDate: new Date(date.getTime() + 3600000)
                            .toISOString()
                            .slice(0, 16),
                        });
                        setShowEventModal(true);
                      }}
                    >
                      {hourEvents.map((event) => (
                        <div key={event.id} className="relative mb-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className="w-full text-left text-xs p-1 rounded truncate pr-6"
                            style={{
                              backgroundColor: event.color + "20",
                              color: event.color,
                            }}
                          >
                            {event.extendedProps?.isRecurring && (
                              <Repeat className="h-3 w-3 inline mr-1" />
                            )}
                            {event.title}
                          </button>
                          {/* Delete button for events */}
                          {(user?.role === "admin" ||
                            event.extendedProps?.isCreator) && (
                            <button
                              onClick={(e) => handleDeleteClick(event, e)}
                              className="absolute right-0 top-0 hidden group-hover:block p-1 text-red-500 hover:text-red-700"
                              title="Delete event"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });

    return (
      <div className="space-y-2">
        {hours.map((hour) => {
          const hourEvents = dayEvents.filter((event) => {
            const eventDate = new Date(event.start);
            return eventDate.getHours() === hour;
          });

          return (
            <div
              key={hour}
              className="flex border-b min-h-[60px] hover:bg-gray-50 cursor-pointer group"
              onClick={() => {
                const date = new Date(currentDate);
                date.setHours(hour);
                setFormData({
                  ...formData,
                  startDate: date.toISOString().slice(0, 16),
                  endDate: new Date(date.getTime() + 3600000)
                    .toISOString()
                    .slice(0, 16),
                });
                setShowEventModal(true);
              }}
            >
              <div className="w-20 p-2 text-sm text-right">
                {hour % 12 || 12} {hour < 12 ? "AM" : "PM"}
              </div>
              <div className="flex-1 p-2">
                {hourEvents.map((event) => (
                  <div key={event.id} className="relative mb-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className="w-full text-left p-2 rounded mb-1 pr-8"
                      style={{
                        backgroundColor: event.color + "20",
                        color: event.color,
                      }}
                    >
                      <div className="font-medium">
                        {event.extendedProps?.isRecurring && (
                          <Repeat className="h-4 w-4 inline mr-1" />
                        )}
                        {event.title}
                      </div>
                      <div className="text-xs">
                        {new Date(event.start).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(event.end).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {event.extendedProps?.location && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.extendedProps.location}
                        </div>
                      )}
                    </button>
                    {/* Delete button for events */}
                    {(user?.role === "admin" ||
                      event.extendedProps?.isCreator) && (
                      <button
                        onClick={(e) => handleDeleteClick(event, e)}
                        className="absolute right-2 top-2 hidden group-hover:block p-1 text-red-500 hover:text-red-700"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Header setIsOpen={setIsOpen} />

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Campaign Calendar</h3>
            <p className="text-sm text-gray-600">
              Schedule events, track time off, and manage team availability
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
            >
              Today
            </button>
            <button
              onClick={handleCreateEvent}
              className="px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-xs text-blue-600">Total Events</p>
            <p className="text-xl font-bold text-blue-900">
              {stats?.totalEvents || 0}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-xs text-purple-600">Meetings</p>
            <p className="text-xl font-bold text-purple-900">
              {stats?.meetings || 0}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-xs text-green-600">Canvassing</p>
            <p className="text-xl font-bold text-green-900">
              {stats?.canvassing || 0}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-xs text-yellow-600">Fundraisers</p>
            <p className="text-xl font-bold text-yellow-900">
              {stats?.fundraisers || 0}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <p className="text-xs text-red-600">Time Off</p>
            <p className="text-xl font-bold text-red-900">
              {stats?.timeOff || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="bg-white shadow rounded-lg">
        {/* Calendar Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <h4 className="text-lg font-medium">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded relative"
            >
              <Filter className="h-5 w-5" />
              {filters.categories.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
            <div className="flex border rounded">
              {["month", "week", "day"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1 text-sm capitalize ${
                    view === v ? "bg-blue-600 text-white" : "hover:bg-gray-50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium">Filters</h5>
              <button
                onClick={() =>
                  setFilters({
                    categories: [],
                    visibility: [],
                    showTimeOff: true,
                  })
                }
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Categories
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.name] || MoreHorizontal;
                    return (
                      <label key={cat._id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(cat.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                categories: [...filters.categories, cat.name],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                categories: filters.categories.filter(
                                  (c) => c !== cat.name,
                                ),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <Icon
                          className="h-4 w-4 mr-1"
                          style={{ color: cat.color }}
                        />
                        <span className="text-sm">{cat.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Visibility
                </label>
                <div className="space-y-2">
                  {[
                    "public",
                    "team",
                    "management",
                    "private",
                    "invite_only",
                  ].map((v) => {
                    const Icon = VISIBILITY_ICONS[v];
                    return (
                      <label key={v} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.visibility.includes(v)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                visibility: [...filters.visibility, v],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                visibility: filters.visibility.filter(
                                  (vv) => vv !== v,
                                ),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <Icon className="h-4 w-4 mr-1" />
                        <span className="text-sm capitalize">
                          {v.replace("_", " ")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Options
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showTimeOff}
                    onChange={(e) =>
                      setFilters({ ...filters, showTimeOff: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Show Time Off</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {view === "month" && renderMonthView()}
              {view === "week" && renderWeekView()}
              {view === "day" && renderDayView()}
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Upcoming Events
          </h4>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming events</p>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event._id}
                  className="border-l-4 pl-3 py-1 cursor-pointer hover:bg-gray-50 group relative"
                  style={{ borderColor: CATEGORY_COLORS[event.category] }}
                  onClick={() =>
                    handleEventClick({
                      id: event._id,
                      title: event.title,
                      start: event.startDate,
                      end: event.endDate,
                      color: CATEGORY_COLORS[event.category],
                      extendedProps: {
                        category: event.category,
                        location: event.location,
                        description: event.description,
                        visibility: event.visibility,
                        isCreator: event.createdBy?._id === user?.id,
                        isRecurring: event.recurring?.isRecurring,
                        recurring: event.recurring,
                      },
                    })
                  }
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">
                        {event.recurring?.isRecurring && (
                          <Repeat className="h-3 w-3 inline mr-1 text-gray-500" />
                        )}
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()} at{" "}
                        {new Date(event.startDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </p>
                      )}
                    </div>
                    {/* Delete button for upcoming events */}
                    {(user?.role === "admin" ||
                      event.createdBy?._id === user?.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(
                            {
                              id: event._id,
                              title: event.title,
                            },
                            e,
                          );
                        }}
                        className="hidden group-hover:block p-1 text-red-500 hover:text-red-700"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Out of Office */}
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Umbrella className="h-5 w-5 mr-2 text-green-500" />
            Out of Office
          </h4>
          <div className="space-y-3">
            {outOfOffice.length === 0 ? (
              <p className="text-sm text-gray-500">No one is out of office</p>
            ) : (
              outOfOffice.map((entry) => (
                <div key={entry.id} className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-green-600 font-semibold text-xs">
                      {entry.user?.firstName?.[0] || ""}
                      {entry.user?.lastName?.[0] || ""}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {entry.user?.firstName || ""} {entry.user?.lastName || ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.startDate).toLocaleDateString()} -{" "}
                      {new Date(entry.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-4">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={handleCreateEvent}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center"
            >
              <Plus className="h-4 w-4 mr-2 text-blue-500" />
              <span>Create Event</span>
            </button>
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  isTimeOff: true,
                  category: "vacation",
                  visibility: "management",
                });
                setShowEventModal(true);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center"
            >
              <Umbrella className="h-4 w-4 mr-2 text-green-500" />
              <span>Request Time Off</span>
            </button>
            <button
              onClick={handleExport}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center"
            >
              <Download className="h-4 w-4 mr-2 text-purple-500" />
              <span>Export Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recurring Edit Choice Modal */}
      {showRecurringChoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                Edit Recurring Event
              </h3>
              <p className="text-gray-600 mb-4">
                This is a recurring event. How would you like to edit it?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleRecurringChoice("single")}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">This event only</div>
                  <div className="text-sm text-gray-500">
                    Changes will only apply to this single occurrence
                  </div>
                </button>

                <button
                  onClick={() => handleRecurringChoice("future")}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">This and future events</div>
                  <div className="text-sm text-gray-500">
                    Changes will apply to this and all following occurrences
                  </div>
                </button>

                <button
                  onClick={() => handleRecurringChoice("all")}
                  className="w-full text-left p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">All events in series</div>
                  <div className="text-sm text-gray-500">
                    Changes will apply to every occurrence
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowRecurringChoice(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditMode(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Event description"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date/Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date/Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={formData.allDay}
                    onChange={(e) =>
                      setFormData({ ...formData, allDay: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label htmlFor="allDay" className="text-sm">
                    All day event
                  </label>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Event location"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.name] || MoreHorizontal;
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, category: cat.name })
                          }
                          className={`p-2 border rounded flex items-center justify-center space-x-1 ${
                            formData.category === cat.name
                              ? "border-2 border-blue-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: cat.color }}
                          />
                          <span className="text-xs">{cat.displayName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visibility */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {[
                      { value: "public", label: "Public", icon: Globe },
                      { value: "team", label: "Team", icon: Users },
                      { value: "management", label: "Management", icon: Lock },
                      { value: "private", label: "Private", icon: EyeOff },
                      {
                        value: "invite_only",
                        label: "Invite Only",
                        icon: UserPlus,
                      },
                    ].map((v) => {
                      const Icon = v.icon;
                      return (
                        <button
                          key={v.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, visibility: v.value })
                          }
                          className={`p-2 border rounded flex items-center justify-center space-x-1 ${
                            formData.visibility === v.value
                              ? "border-2 border-blue-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recurring Event Options */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.recurring.isRecurring}
                      onChange={(e) => {
                        const startDate = new Date(formData.startDate);
                        setFormData({
                          ...formData,
                          recurring: {
                            ...formData.recurring,
                            isRecurring: e.target.checked,
                            pattern: "weekly",
                            interval: 1,
                            dayOfWeek:
                              e.target.checked && formData.startDate
                                ? [startDate.getDay()]
                                : [],
                          },
                        });
                      }}
                      className="mr-2"
                    />
                    <label
                      htmlFor="isRecurring"
                      className="font-medium flex items-center"
                    >
                      <Repeat className="h-4 w-4 mr-1" />
                      Recurring Event
                    </label>
                  </div>

                  {formData.recurring.isRecurring && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded">
                      {/* Pattern Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Repeat Pattern
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { value: "daily", label: "Daily" },
                            { value: "weekly", label: "Weekly" },
                            { value: "monthly", label: "Monthly" },
                            { value: "yearly", label: "Yearly" },
                          ].map((pattern) => (
                            <button
                              key={pattern.value}
                              type="button"
                              onClick={() => {
                                const startDate = new Date(formData.startDate);
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    pattern: pattern.value,
                                    dayOfWeek:
                                      pattern.value === "weekly" &&
                                      formData.startDate
                                        ? [startDate.getDay()]
                                        : pattern.value === "weekly"
                                          ? []
                                          : formData.recurring.dayOfWeek,
                                    dayOfMonth:
                                      pattern.value === "monthly" &&
                                      formData.startDate
                                        ? startDate.getDate()
                                        : null,
                                  },
                                });
                              }}
                              className={`px-3 py-2 text-sm border rounded ${
                                formData.recurring.pattern === pattern.value
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {pattern.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Interval */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Repeat every
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={formData.recurring.interval}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                recurring: {
                                  ...formData.recurring,
                                  interval: parseInt(e.target.value) || 1,
                                },
                              })
                            }
                            className="w-20 px-3 py-2 border rounded mr-2"
                          />
                          <span className="text-sm text-gray-600">
                            {formData.recurring.pattern === "daily" && "day(s)"}
                            {formData.recurring.pattern === "weekly" &&
                              "week(s)"}
                            {formData.recurring.pattern === "monthly" &&
                              "month(s)"}
                            {formData.recurring.pattern === "yearly" &&
                              "year(s)"}
                          </span>
                        </div>
                      </div>

                      {/* Weekly specific: Days of week */}
                      {formData.recurring.pattern === "weekly" && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Repeat on
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                            ].map((day, index) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const currentDays =
                                    formData.recurring.dayOfWeek || [];
                                  const newDays = currentDays.includes(index)
                                    ? currentDays.filter((d) => d !== index)
                                    : [...currentDays, index].sort();
                                  setFormData({
                                    ...formData,
                                    recurring: {
                                      ...formData.recurring,
                                      dayOfWeek: newDays,
                                    },
                                  });
                                }}
                                className={`w-10 h-10 text-sm rounded-full ${
                                  formData.recurring.dayOfWeek?.includes(index)
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                          {formData.recurring.dayOfWeek?.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                              Please select at least one day
                            </p>
                          )}
                        </div>
                      )}

                      {/* End options */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recurringEnd"
                              checked={
                                !formData.recurring.endDate &&
                                !formData.recurring.occurrences
                              }
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    endDate: null,
                                    occurrences: null,
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">Never</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recurringEnd"
                              checked={!!formData.recurring.occurrences}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    endDate: null,
                                    occurrences:
                                      formData.recurring.occurrences || 10,
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">After </span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={formData.recurring.occurrences || 10}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    occurrences: parseInt(e.target.value) || 1,
                                    endDate: null,
                                  },
                                })
                              }
                              className="w-16 mx-2 px-2 py-1 border rounded text-sm"
                              disabled={!formData.recurring.occurrences}
                            />
                            <span className="text-sm">occurrences</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="recurringEnd"
                              checked={!!formData.recurring.endDate}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    endDate:
                                      formData.recurring.endDate ||
                                      formData.startDate.split("T")[0],
                                    occurrences: null,
                                  },
                                })
                              }
                              className="mr-2"
                            />
                            <span className="text-sm">On </span>
                            <input
                              type="date"
                              value={
                                formData.recurring.endDate?.split("T")[0] || ""
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  recurring: {
                                    ...formData.recurring,
                                    endDate: e.target.value,
                                    occurrences: null,
                                  },
                                })
                              }
                              className="ml-2 px-2 py-1 border rounded text-sm"
                              disabled={!formData.recurring.endDate}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invite Only Section */}
                {formData.visibility === "invite_only" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Specific Users
                    </h4>

                    {/* Search input */}
                    <div className="mb-3 relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users by name or email..."
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Search results */}
                      {searchTerm && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searching ? (
                            <div className="p-2 text-sm text-gray-500">
                              Searching...
                            </div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((user) => (
                              <button
                                key={user._id}
                                type="button"
                                onClick={() => addAttendee(user)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center"
                              >
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                  <span className="text-blue-600 font-semibold text-xs">
                                    {user.firstName?.[0] || ""}
                                    {user.lastName?.[0] || ""}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {user.email}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-gray-500">
                              No users found
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected attendees */}
                    {selectedUsers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Selected attendees:
                        </p>
                        {selectedUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {user.firstName?.[0] || ""}
                                  {user.lastName?.[0] || ""}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttendee(user._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Time Off Options */}
                {formData.isTimeOff && (
                  <div className="bg-yellow-50 p-4 rounded">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Umbrella className="h-4 w-4 mr-2" />
                      Time Off Details
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm mb-1">Type</label>
                        <select
                          value={formData.timeOffDetails?.type || "vacation"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeOffDetails: {
                                ...(formData.timeOffDetails || {}),
                                type: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="vacation">Vacation</option>
                          <option value="medical">Medical</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Reason</label>
                        <textarea
                          value={formData.timeOffDetails?.reason || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeOffDetails: {
                                ...(formData.timeOffDetails || {}),
                                reason: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded"
                          rows="2"
                          placeholder="Reason for time off"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Emergency Contact
                        </label>
                        <input
                          type="text"
                          value={
                            formData.timeOffDetails?.emergencyContact?.name ||
                            ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeOffDetails: {
                                ...(formData.timeOffDetails || {}),
                                emergencyContact: {
                                  ...(formData.timeOffDetails
                                    ?.emergencyContact || {}),
                                  name: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Name"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Zoom Integration */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Zoom Link
                  </label>
                  <input
                    type="url"
                    value={formData.zoomLink || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, zoomLink: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                {/* Delete button for editing existing events */}
                {selectedEvent && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteClick(selectedEvent, e);
                        setShowEventModal(false);
                      }}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </button>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      setEditMode(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      formData.recurring.isRecurring &&
                      formData.recurring.pattern === "weekly" &&
                      formData.recurring.dayOfWeek?.length === 0
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedEvent ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Delete Event</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &ldquo;{eventToDelete?.title}
                &rdquo;? This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setEventToDelete(null);
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
