import { format as dateFnsFormat, isToday, isTomorrow, isPast, differenceInHours, parseISO } from "date-fns";

export type RoundType =
  | "phone_screen"
  | "technical"
  | "behavioral"
  | "take_home"
  | "onsite"
  | "hiring_manager"
  | "final"
  | "other";

export type InterviewFormat = "video" | "phone" | "onsite";

export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"
  | "no_show";

export type InterviewSentiment = "great" | "okay" | "rough" | string;

export interface InterviewItem {
  id: string;
  applicationId: string;
  userId: string;
  roundType: RoundType | string;
  roundLabel?: string | null;
  roundNumber: string;
  scheduledAt?: Date | string | null;
  durationMins?: string | null;
  timezone?: string | null;
  format: InterviewFormat | string;
  meetingLink?: string | null;
  location?: string | null;
  interviewerName?: string | null;
  interviewerTitle?: string | null;
  interviewerLinkedin?: string | null;
  status: InterviewStatus | string;
  prepNotes?: string | null;
  questionsToAsk?: string | null;
  focusAreas?: string | null;
  sentiment?: InterviewSentiment | null;
  debriefNotes?: string | null;
  questionsAsked?: string | null;
  nextSteps?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpcomingInterviewItem extends InterviewItem {
  role_name: string;
  company_name: string;
  link: string;
  appLocation: string;
  platform: string;
}

export const roundTypeOptions: Array<{
  value: RoundType;
  label: string;
  defaultDuration: number;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "phone_screen",
    label: "Recruiter / Phone Screen",
    shortLabel: "Phone Screen",
    defaultDuration: 30,
    description: "Initial recruiter conversation & mutual fit discussion",
  },
  {
    value: "technical",
    label: "Technical Screen / Coding",
    shortLabel: "Tech Screen",
    defaultDuration: 60,
    description: "Live coding, data structures, algorithm problem solving",
  },
  {
    value: "behavioral",
    label: "Behavioral & Culture Fit",
    shortLabel: "Behavioral",
    defaultDuration: 45,
    description: "STAR leadership principles, collaboration & team fit",
  },
  {
    value: "take_home",
    label: "Take-Home Project Review",
    shortLabel: "Take-Home",
    defaultDuration: 60,
    description: "Assignment presentation & technical architecture review",
  },
  {
    value: "onsite",
    label: "Onsite / Virtual Panel Loop",
    shortLabel: "Onsite Loop",
    defaultDuration: 180,
    description: "Multi-round comprehensive interview panel",
  },
  {
    value: "hiring_manager",
    label: "Hiring Manager 1-on-1",
    shortLabel: "Hiring Manager",
    defaultDuration: 45,
    description: "Role expectations, team roadmap & mutual alignment",
  },
  {
    value: "final",
    label: "Final / Executive Round",
    shortLabel: "Final Round",
    defaultDuration: 45,
    description: "VP / Founder conversation and offer alignment",
  },
  {
    value: "other",
    label: "Other / Custom Stage",
    shortLabel: "Custom",
    defaultDuration: 45,
    description: "Ad-hoc conversation or informal coffee chat",
  },
];

export const formatOptions: Array<{
  value: InterviewFormat;
  label: string;
}> = [
  { value: "video", label: "Video Call (Zoom/Meet/Teams)" },
  { value: "phone", label: "Phone Call" },
  { value: "onsite", label: "In-Person / Onsite" },
];

export const interviewStatusOptions: Array<{
  value: InterviewStatus;
  label: string;
}> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const pipelineTemplates = {
  tech_loop: {
    name: "Standard Tech Loop (4 Rounds)",
    description: "Recruiter Screen → Technical Screen → System Design → Behavioral",
    rounds: [
      { roundType: "phone_screen", roundLabel: "Recruiter Screen", durationMins: "30" },
      { roundType: "technical", roundLabel: "Technical Screen", durationMins: "60" },
      { roundType: "technical", roundLabel: "System Design & Architecture", durationMins: "60" },
      { roundType: "behavioral", roundLabel: "Hiring Manager & Culture Fit", durationMins: "45" },
    ],
  },
  quick_screen: {
    name: "Quick Screen (1 Round)",
    description: "Single Recruiter / Hiring Manager conversation",
    rounds: [
      { roundType: "phone_screen", roundLabel: "Initial Recruiter Screen", durationMins: "30" },
    ],
  },
  startup_fast_track: {
    name: "Startup Fast Track (2 Rounds)",
    description: "Founder Chat → Technical Deep Dive & Work Sample",
    rounds: [
      { roundType: "hiring_manager", roundLabel: "Founder / HM Intro", durationMins: "30" },
      { roundType: "technical", roundLabel: "Technical Deep Dive & Architecture", durationMins: "60" },
    ],
  },
  take_home_loop: {
    name: "Take-Home Assignment Loop (3 Rounds)",
    description: "Intro Screen → Take-Home Submission → Presentation Review",
    rounds: [
      { roundType: "phone_screen", roundLabel: "Recruiter Screen", durationMins: "30" },
      { roundType: "take_home", roundLabel: "Take-Home Project Presentation", durationMins: "60" },
      { roundType: "final", roundLabel: "Executive & Team Alignment", durationMins: "45" },
    ],
  },
};

export function getRoundTypeLabel(roundType: string, customLabel?: string | null): string {
  if (customLabel && customLabel.trim()) {
    return customLabel.trim();
  }
  const option = roundTypeOptions.find((opt) => opt.value === roundType);
  return option?.label || "Interview Round";
}

export function getRoundTypeShortLabel(roundType: string, customLabel?: string | null): string {
  if (customLabel && customLabel.trim()) {
    return customLabel.trim();
  }
  const option = roundTypeOptions.find((opt) => opt.value === roundType);
  return option?.shortLabel || "Interview";
}

export function getRoundTypeColors(roundType: string) {
  switch (roundType) {
    case "phone_screen":
      return {
        badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
        dot: "bg-sky-500",
        pill: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
        border: "border-sky-500/30",
      };
    case "technical":
      return {
        badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
        dot: "bg-amber-500",
        pill: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
        border: "border-amber-500/30",
      };
    case "behavioral":
    case "hiring_manager":
      return {
        badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        dot: "bg-purple-500",
        pill: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
        border: "border-purple-500/30",
      };
    case "take_home":
      return {
        badge: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
        dot: "bg-orange-500",
        pill: "bg-orange-500/10 text-orange-800 dark:text-orange-300",
        border: "border-orange-500/30",
      };
    case "onsite":
      return {
        badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        dot: "bg-indigo-500",
        pill: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        border: "border-indigo-500/30",
      };
    case "final":
      return {
        badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
        dot: "bg-rose-500",
        pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        border: "border-rose-500/30",
      };
    default:
      return {
        badge: "bg-secondary text-secondary-foreground border-border",
        dot: "bg-muted-foreground",
        pill: "bg-secondary text-secondary-foreground",
        border: "border-border",
      };
  }
}

export function getInterviewStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      };
    case "rescheduled":
      return {
        label: "Rescheduled",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 line-through",
      };
    case "no_show":
      return {
        label: "No Show",
        className: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
      };
    case "scheduled":
    default:
      return {
        label: "Scheduled",
        className: "bg-primary/15 text-primary border-primary/30",
      };
  }
}

export function formatInterviewDate(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return "Date TBD";
  try {
    const d = typeof dateVal === "string" ? parseISO(dateVal) : dateVal;
    if (isNaN(d.getTime())) return "Date TBD";
    return dateFnsFormat(d, "EEE, MMM d, yyyy · h:mm a");
  } catch {
    return "Date TBD";
  }
}

export function getRelativeInterviewTime(scheduledAt: Date | string | null | undefined): {
  label: string;
  urgency: "today" | "tomorrow" | "upcoming" | "past" | "none";
} {
  if (!scheduledAt) return { label: "Not scheduled", urgency: "none" };
  try {
    const d = typeof scheduledAt === "string" ? parseISO(scheduledAt) : scheduledAt;
    if (isNaN(d.getTime())) return { label: "Not scheduled", urgency: "none" };

    const now = new Date();
    if (isToday(d)) {
      const hoursDiff = differenceInHours(d, now);
      if (hoursDiff > 0 && hoursDiff <= 3) {
        return { label: `In ${hoursDiff}h (${dateFnsFormat(d, "h:mm a")})`, urgency: "today" };
      }
      return { label: `Today at ${dateFnsFormat(d, "h:mm a")}`, urgency: "today" };
    }
    if (isTomorrow(d)) {
      return { label: `Tomorrow at ${dateFnsFormat(d, "h:mm a")}`, urgency: "tomorrow" };
    }
    if (isPast(d)) {
      return { label: `Passed on ${dateFnsFormat(d, "MMM d")}`, urgency: "past" };
    }
    return { label: dateFnsFormat(d, "EEE, MMM d · h:mm a"), urgency: "upcoming" };
  } catch {
    return { label: "Not scheduled", urgency: "none" };
  }
}

export function getGoogleCalendarUrl(
  interview: {
    scheduledAt?: Date | string | null;
    durationMins?: string | number | null;
    roundType: string;
    roundLabel?: string | null;
    meetingLink?: string | null;
    location?: string | null;
    interviewerName?: string | null;
    interviewerTitle?: string | null;
    prepNotes?: string | null;
  },
  app: {
    role_name: string;
    company_name: string;
  },
): string {
  if (!interview.scheduledAt) return "";
  try {
    const startDate = typeof interview.scheduledAt === "string"
      ? parseISO(interview.scheduledAt)
      : interview.scheduledAt;

    if (isNaN(startDate.getTime())) return "";

    const duration = parseInt(String(interview.durationMins || "30"), 10) || 30;
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const formatGCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

    const title = encodeURIComponent(
      `${getRoundTypeLabel(interview.roundType, interview.roundLabel)} - ${app.company_name} (${app.role_name})`,
    );

    const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

    const detailsArr: string[] = [
      `Company: ${app.company_name}`,
      `Role: ${app.role_name}`,
      `Round: ${getRoundTypeLabel(interview.roundType, interview.roundLabel)}`,
    ];

    if (interview.interviewerName) {
      detailsArr.push(
        `Interviewer: ${interview.interviewerName}${interview.interviewerTitle ? ` (${interview.interviewerTitle})` : ""}`,
      );
    }
    if (interview.meetingLink) {
      detailsArr.push(`Meeting Link: ${interview.meetingLink}`);
    }
    if (interview.prepNotes) {
      detailsArr.push(`\nPrep Notes:\n${interview.prepNotes}`);
    }

    const details = encodeURIComponent(detailsArr.join("\n"));
    const location = encodeURIComponent(interview.meetingLink || interview.location || "");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  } catch {
    return "";
  }
}

export function escapeIcsText(str: string): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function getUserLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function generateIcsFileString(
  interview: {
    id?: string;
    scheduledAt?: Date | string | null;
    durationMins?: string | number | null;
    roundType: string;
    roundLabel?: string | null;
    meetingLink?: string | null;
    location?: string | null;
    interviewerName?: string | null;
    interviewerTitle?: string | null;
    prepNotes?: string | null;
  },
  app: {
    role_name: string;
    company_name: string;
  },
): string {
  if (!interview.scheduledAt) return "";
  const startDate = typeof interview.scheduledAt === "string"
    ? parseISO(interview.scheduledAt)
    : interview.scheduledAt;

  if (isNaN(startDate.getTime())) return "";

  const duration = parseInt(String(interview.durationMins || "30"), 10) || 30;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

  const summary = escapeIcsText(
    `${getRoundTypeLabel(interview.roundType, interview.roundLabel)} - ${app.company_name} (${app.role_name})`,
  );

  const descriptionParts: string[] = [
    `Interview Round: ${getRoundTypeLabel(interview.roundType, interview.roundLabel)}`,
    `Company: ${app.company_name}`,
    `Role: ${app.role_name}`,
  ];

  if (interview.interviewerName) {
    descriptionParts.push(
      `Interviewer: ${interview.interviewerName}${interview.interviewerTitle ? ` (${interview.interviewerTitle})` : ""}`,
    );
  }
  if (interview.meetingLink) {
    descriptionParts.push(`Meeting Link: ${interview.meetingLink}`);
  }
  if (interview.prepNotes) {
    descriptionParts.push(`Prep Notes: ${interview.prepNotes}`);
  }

  const description = escapeIcsText(descriptionParts.join("\n"));
  const location = escapeIcsText(interview.meetingLink || interview.location || "");
  const uid = `interview-${interview.id || Date.now()}@jobtracker.app`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Job Application Tracker//Interview Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}
