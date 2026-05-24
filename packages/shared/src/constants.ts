// Monitor types
export const MONITOR_TYPES = ["http", "ping", "port", "keyword"] as const;
export type MonitorType = (typeof MONITOR_TYPES)[number];

// Check intervals in seconds
export const CHECK_INTERVALS = {
  "30s": 30,
  "1m": 60,
  "2m": 120,
  "5m": 300,
} as const;

// Incident severity
export const SEVERITY_LEVELS = ["minor", "major", "critical"] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

// Incident status
export const INCIDENT_STATUSES = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

// Monitor status
export const MONITOR_STATUSES = ["up", "down", "paused", "pending"] as const;
export type MonitorStatus = (typeof MONITOR_STATUSES)[number];

// Alert channel types
export const ALERT_CHANNEL_TYPES = [
  "email",
  "slack",
  "discord",
  "webhook",
] as const;
export type AlertChannelType = (typeof ALERT_CHANNEL_TYPES)[number];

// Check regions
export const CHECK_REGIONS = [
  "us-east",
  "eu-west",
  "ap-southeast",
] as const;
export type CheckRegion = (typeof CHECK_REGIONS)[number];

// Plans
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxMonitors: 25,
    minInterval: 120, // 2 min
    maxStatusPages: 1,
    features: ["email_alerts"],
  },
  starter: {
    name: "Starter",
    price: 9,
    maxMonitors: 100,
    minInterval: 60, // 1 min
    maxStatusPages: 3,
    features: ["email_alerts", "slack", "discord", "webhook", "incidents"],
  },
  pro: {
    name: "Pro",
    price: 29,
    maxMonitors: 500,
    minInterval: 30, // 30 sec
    maxStatusPages: -1, // unlimited
    features: [
      "email_alerts",
      "slack",
      "discord",
      "webhook",
      "incidents",
      "oncall",
      "escalations",
      "pdf_reports",
    ],
  },
  business: {
    name: "Business",
    price: 69,
    maxMonitors: 2000,
    minInterval: 30,
    maxStatusPages: -1,
    features: [
      "email_alerts",
      "slack",
      "discord",
      "webhook",
      "incidents",
      "oncall",
      "escalations",
      "pdf_reports",
      "sso",
      "teams",
      "priority_support",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// HTTP methods for monitors
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
