import { Timestamp } from "firebase/firestore";

export type Language = "en" | "bn";
export type MembershipTier = "free" | "premium" | "pro";
export type ToolTier = "free" | "premium" | "pro";
export type ToolType = "file" | "snippet" | "link";
export type ToolStatus = "active" | "draft";
export type LayoutDensity = "comfortable" | "compact";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  membershipTier: MembershipTier;
  membershipExpiresAt?: Timestamp | null;
  restricted: boolean;
  role?: "admin" | "user";
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  tier: ToolTier;
  type: ToolType;
  status: ToolStatus;
  thumbnailUrl?: string;
  fileUrl?: string;
  externalUrl?: string;
  codeSnippet?: string;
  redirectOnClick: boolean;
  usageCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  accent: string;
  createdAt?: Timestamp;
}

export interface MembershipPackage {
  id: string;
  name: string;
  tier: MembershipTier;
  priceBdt: number;
  durationDays: number;
  active: boolean;
  features: string[];
  createdAt?: Timestamp;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  active: boolean;
  createdAt?: Timestamp;
}

export interface UiSettings {
  heroTitle: string;
  heroSubtitle: string;
  accentColor: string;
  layoutDensity: LayoutDensity;
  noticeText: string;
}
