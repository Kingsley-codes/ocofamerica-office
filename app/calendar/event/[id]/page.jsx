// app/calendar/event/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  Check,
  X,
  Minus,
  Video,
  Download,
  Mail,
  Phone,
  UserPlus,
  Heart,
  Umbrella,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/auth";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [updatingRsvp, setUpdatingRsvp] = useState(false);

  const eventId = params.id;
  const rsvpParam = searchParams.get("rsvp");

  useEffect(() => {
    if (rsvpParam && ["yes", "no", "maybe"].includes(rsvpParam)) {
      handleRSVP(
        rsvpParam === "yes"
          ? "accepted"
          : rsvpParam === "no"
            ? "declined"
            : "maybe",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rsvpParam]);

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/calendar/${eventId}`);
      if (response.success) {
        setEvent(response.event);

        // Find current user's RSVP status
        const currentUserRsvp = response.event.attendees?.find(
          (a) => a.user?._id === localStorage.getItem("user_id"),
        );
        if (currentUserRsvp) {
          setRsvpStatus(currentUserRsvp.status);
        }
      }
    } catch (error) {
      console.error("Error loading event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status) => {
    setUpdatingRsvp(true);
    try {
      const userId = localStorage.getItem("user_id");
      const response = await apiRequest(
        `/calendar/${eventId}/attendees/${userId}`,
        {
          method: "PUT",
          body: { status },
        },
      );

      if (response.success) {
        setRsvpStatus(status);
        loadEvent();
      }
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Failed to update RSVP");
    } finally {
      setUpdatingRsvp(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
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
    return colors[category] || "#6B7280";
  };

  const getCategoryIcon = (category) => {
    const icons = {
      meeting: Users,
      vacation: Umbrella,
      medical: Heart,
      event: Calendar,
      debate: AlertCircle,
      public_speaking: AlertCircle,
      fundraiser: AlertCircle,
      canvassing: AlertCircle,
      phone_banking: Phone,
      donor_meeting: Users,
      press_media: AlertCircle,
      other: AlertCircle,
    };
    return icons[category] || AlertCircle;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">{error || "Event not found"}</p>
          <button
            onClick={() => router.push("/dashboard?tab=calendar")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard?tab=calendar")}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Calendar
        </button>

        {/* Main event card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header with category color */}
          <div
            className="h-2"
            style={{ backgroundColor: getCategoryColor(event.category) }}
          />

          <div className="p-6">
            {/* Title and category */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {event.title}
                </h1>
                <div className="mt-2 flex items-center">
                  <CategoryIcon
                    className="h-4 w-4 mr-1"
                    style={{ color: getCategoryColor(event.category) }}
                  />
                  <span
                    className="text-sm capitalize"
                    style={{ color: getCategoryColor(event.category) }}
                  >
                    {event.category.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* RSVP Status */}
              {rsvpStatus && (
                <div
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor:
                      rsvpStatus === "accepted"
                        ? "#10B98120"
                        : rsvpStatus === "declined"
                          ? "#EF444420"
                          : "#F59E0B20",
                    color:
                      rsvpStatus === "accepted"
                        ? "#10B981"
                        : rsvpStatus === "declined"
                          ? "#EF4444"
                          : "#F59E0B",
                  }}
                >
                  {rsvpStatus === "accepted"
                    ? "✓ Going"
                    : rsvpStatus === "declined"
                      ? "✗ Not Going"
                      : "? Maybe"}
                </div>
              )}
            </div>

            {/* Event details */}
            <div className="mt-6 space-y-4">
              {/* Date and Time */}
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-900 font-medium">
                    {formatDate(event.startDate)}
                  </p>
                  {!event.allDay ? (
                    <p className="text-gray-600">
                      {formatTime(event.startDate)} -{" "}
                      {formatTime(event.endDate)}
                    </p>
                  ) : (
                    <p className="text-gray-600">All day</p>
                  )}
                </div>
              </div>

              {/* Location */}
              {event.location && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{event.location}</p>
                    {event.mapLink && (
                      <a
                        href={event.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View on map
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Zoom Link */}
              {event.zoomLink && (
                <div className="flex items-start">
                  <Video className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <a
                    href={event.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Join Zoom Meeting
                  </a>
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Description
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              )}

              {/* Public Notes */}
              {event.publicNotes && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {event.publicNotes}
                  </p>
                </div>
              )}

              {/* Time Off Details */}
              {event.isTimeOff && event.timeOffDetails && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <Umbrella className="h-4 w-4 mr-2" />
                    Time Off Details
                  </h3>
                  <p className="text-yellow-700">
                    <strong>Type:</strong> {event.timeOffDetails.type}
                  </p>
                  {event.timeOffDetails.reason && (
                    <p className="text-yellow-700 mt-1">
                      <strong>Reason:</strong> {event.timeOffDetails.reason}
                    </p>
                  )}
                  <p className="text-yellow-700 mt-1">
                    <strong>Status:</strong>{" "}
                    {event.timeOffDetails.approvalStatus}
                  </p>
                </div>
              )}
            </div>

            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Attendees ({event.attendees.length})
                </h3>
                <div className="space-y-2">
                  {event.attendees.map((attendee) => (
                    <div
                      key={attendee.user._id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <span className="text-blue-600 font-semibold text-xs">
                            {attendee.user.firstName?.[0] || ""}
                            {attendee.user.lastName?.[0] || ""}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {attendee.user.firstName} {attendee.user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attendee.user.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            attendee.status === "accepted"
                              ? "#10B98120"
                              : attendee.status === "declined"
                                ? "#EF444420"
                                : attendee.status === "maybe"
                                  ? "#F59E0B20"
                                  : "#6B728020",
                          color:
                            attendee.status === "accepted"
                              ? "#10B981"
                              : attendee.status === "declined"
                                ? "#EF4444"
                                : attendee.status === "maybe"
                                  ? "#F59E0B"
                                  : "#6B7280",
                        }}
                      >
                        {attendee.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RSVP Buttons */}
            {event.visibility === "invite_only" && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">RSVP</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleRSVP("accepted")}
                    disabled={updatingRsvp}
                    className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                      rsvpStatus === "accepted"
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Yes
                  </button>
                  <button
                    onClick={() => handleRSVP("maybe")}
                    disabled={updatingRsvp}
                    className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                      rsvpStatus === "maybe"
                        ? "bg-yellow-50 border-yellow-500 text-yellow-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRSVP("declined")}
                    disabled={updatingRsvp}
                    className={`flex-1 flex items-center justify-center px-4 py-2 border rounded-md ${
                      rsvpStatus === "declined"
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <X className="h-4 w-4 mr-2" />
                    No
                  </button>
                </div>
              </div>
            )}

            {/* Add to calendar */}
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  // Generate ICS download
                  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${new Date(event.startDate).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${new Date(event.endDate).toISOString().replace(/[-:]/g, "").split(".")[0]}Z
LOCATION:${event.location || ""}
DESCRIPTION:${event.description || ""}
END:VEVENT
END:VCALENDAR`;

                  const blob = new Blob([icsContent], {
                    type: "text/calendar",
                  });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${event.title}.ics`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
