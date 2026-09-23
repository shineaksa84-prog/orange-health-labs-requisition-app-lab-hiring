export type RequisitionStatus = 'Open' | 'On Hold' | 'Closed' | 'Cancelled';
export type RequisitionPriority = 'Standard' | 'High' | 'Urgent' | 'Critical';
export type HiringReason = 'Expansion' | 'Replacement' | 'New Shift' | 'Peak Volume' | 'Backfill' | 'Other';

export interface LocationMaster {
  id: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface RoleMaster {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface RequisitionRole {
  roleId: string;
  roleName: string;
  numberOfPositions: number;
  shift?: string;
  experience?: string;
  skills?: string;
}

export interface Requisition {
  id: string;
  requisitionCode: string;
  locationId: string;
  locationName: string;
  roleOpenDate: string; // YYYY-MM-DD
  targetJoiningDate?: string;
  status: RequisitionStatus;
  priority?: RequisitionPriority;
  hiringReason?: HiringReason;
  department?: string;
  taOwnerId: string;
  taOwnerName: string;
  taOwnerEmail: string;
  hiringManager?: string;
  hiringManagerEmail?: string;
  hiringManagerPhone?: string;
  replacementFor?: string;
  notes?: string;
  totalPositions: number;
  roles: RequisitionRole[];
  createdBy: string;
  createdByName: string;
  updatedBy: string;
  updatedByName: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
}

export type UserRole = 'Hiring Manager' | 'TA Specialist' | 'Admin';

export interface UserProfile {
  id: string;
  googleId?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt: string;
}

export interface DashboardKPIs {
  openRequisitions: number;
  openPositions: number;
  locationsHiring: number;
  rolesHiring: number;
  newThisMonth: number;
}

export interface LocationHiringSummary {
  code: string;
  name: string;
  openRequisitions: number;
  openPositions: number;
}

export interface RoleHiringSummary {
  roleId: string;
  roleName: string;
  openPositions: number;
  openRequisitions: number;
  locations: string[];
}

export interface RequisitionFilterParams {
  location?: string;
  role?: string;
  status?: string;
  taOwner?: string;
  dateRangePreset?: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}
