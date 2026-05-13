import { MembershipTier, ToolTier, UserProfile } from "@/lib/types";

const tierRank: Record<MembershipTier, number> = {
  free: 0,
  premium: 1,
  pro: 2
};

export function hasActiveMembership(profile: UserProfile | null) {
  if (!profile || profile.membershipTier === "free") {
    return false;
  }

  const expiresAt = profile.membershipExpiresAt?.toDate?.();
  return !expiresAt || expiresAt.getTime() > Date.now();
}

export function canAccessTool(profile: UserProfile | null, toolTier: ToolTier) {
  if (!profile || profile.restricted) {
    return false;
  }

  if (toolTier === "free") {
    return true;
  }

  if (!hasActiveMembership(profile)) {
    return false;
  }

  return tierRank[profile.membershipTier] >= tierRank[toolTier];
}

export function formatDate(date?: Date | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}
