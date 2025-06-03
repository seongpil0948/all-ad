// User role and team management type definitions

export enum UserRole {
  MASTER = "master",
  TEAM_MATE = "team_mate",
  VIEWER = "viewer",
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface TeamMember extends User {
  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
  permissions?: TeamPermissions;
}

export interface TeamPermissions {
  canViewAllPlatforms: boolean;
  canManageCampaigns: boolean;
  canCreateReports: boolean;
  canInviteMembers: boolean;
  platformAccess?: string[]; // Array of platform IDs
}

export interface TeamInvite {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
  status: "pending" | "accepted" | "expired";
}

// Permission check helpers
export const rolePermissions: Record<UserRole, Partial<TeamPermissions>> = {
  [UserRole.MASTER]: {
    canViewAllPlatforms: true,
    canManageCampaigns: true,
    canCreateReports: true,
    canInviteMembers: true,
  },
  [UserRole.TEAM_MATE]: {
    canViewAllPlatforms: true,
    canManageCampaigns: true,
    canCreateReports: true,
    canInviteMembers: true, // Can invite but with restrictions
  },
  [UserRole.VIEWER]: {
    canViewAllPlatforms: false, // Only assigned platforms
    canManageCampaigns: false,
    canCreateReports: false,
    canInviteMembers: false,
  },
};
