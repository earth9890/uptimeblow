import type {
  MonitorType,
  MonitorStatus,
  SeverityLevel,
  IncidentStatus,
  AlertChannelType,
  CheckRegion,
  PlanKey,
  HttpMethod,
} from "../constants.js";

// ─── User ───────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: PlanKey;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Monitor ────────────────────────────────────────
export interface Monitor {
  id: string;
  userId: string;
  name: string;
  type: MonitorType;
  url: string;
  method: HttpMethod;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string | null;
  keywordType: "present" | "absent" | null;
  regions: CheckRegion[];
  isPaused: boolean;
  alertThreshold: number;
  status: MonitorStatus;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Check Result ───────────────────────────────────
export interface CheckResult {
  id: string;
  monitorId: string;
  region: CheckRegion;
  status: "up" | "down";
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: Date;
}

// ─── Alert Channel ──────────────────────────────────
export interface AlertChannel {
  id: string;
  userId: string;
  type: AlertChannelType;
  name: string;
  config: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
}

// ─── Alert History ──────────────────────────────────
export interface AlertHistoryEntry {
  id: string;
  monitorId: string;
  channelId: string;
  type: "down" | "recovery";
  message: string;
  sentAt: Date;
}

// ─── Incident ───────────────────────────────────────
export interface Incident {
  id: string;
  userId: string;
  monitorId: string | null;
  title: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  startedAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  message: string;
  status: IncidentStatus;
  createdBy: string;
  createdAt: Date;
}

// ─── Status Page ────────────────────────────────────
export interface StatusPage {
  id: string;
  userId: string;
  slug: string;
  name: string;
  customDomain: string | null;
  logoUrl: string | null;
  brandColor: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusPageMonitor {
  id: string;
  statusPageId: string;
  monitorId: string;
  displayName: string;
  sortOrder: number;
}

// ─── API Response Types ─────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard Stats ────────────────────────────────
export interface DashboardStats {
  totalMonitors: number;
  monitorsUp: number;
  monitorsDown: number;
  monitorsPaused: number;
  overallUptime: number;
  activeIncidents: number;
}
