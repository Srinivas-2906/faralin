export interface AuthUser {
  id: string;
  clerkUserId: string;
  email: string;
  role: string;
  studentProfileId?: string;
  universityStaffProfileId?: string;
  universityId?: string;
}
