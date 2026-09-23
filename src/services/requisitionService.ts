import { 
  Requisition, 
  LocationMaster, 
  RoleMaster, 
  UserProfile, 
  DashboardKPIs, 
  LocationHiringSummary, 
  RoleHiringSummary, 
  RequisitionFilterParams,
  RequisitionStatus
} from '../types';
import { db } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { STANDARD_LOCATIONS, STANDARD_ROLES, initializeFirestoreMasters } from './masterDataInit';
import { isDateInCurrentMonth, matchesDatePreset } from '../utils/dateUtils';

export class RequisitionService {
  /**
   * Fetch all locations (fixed master)
   */
  static async getLocations(): Promise<LocationMaster[]> {
    try {
      const snap = await getDocs(collection(db, 'locations'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as LocationMaster));
      }
      // If empty, initialize standard masters in Firestore
      await initializeFirestoreMasters();
      return STANDARD_LOCATIONS;
    } catch (e) {
      console.warn('Firestore getLocations error:', e);
      return STANDARD_LOCATIONS;
    }
  }

  /**
   * Fetch all roles (fixed master)
   */
  static async getRoles(): Promise<RoleMaster[]> {
    try {
      const snap = await getDocs(collection(db, 'roles'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as RoleMaster));
      }
      await initializeFirestoreMasters();
      return STANDARD_ROLES;
    } catch (e) {
      console.warn('Firestore getRoles error:', e);
      return STANDARD_ROLES;
    }
  }

  /**
   * Fetch all users
   */
  static async getUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      }
      return [];
    } catch (e) {
      console.warn('Firestore getUsers error:', e);
      return [];
    }
  }

  /**
   * Generate next requisition code: LAB-YYYY-XXX atomically via Firestore
   */
  static async generateNextRequisitionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LAB-${year}-`;
    
    try {
      const all = await this.getAllRequisitions();
      const numbers = all
        .map(r => r.requisitionCode)
        .filter(code => code && code.startsWith(prefix))
        .map(code => {
          const numStr = code.replace(prefix, '');
          const n = parseInt(numStr, 10);
          return isNaN(n) ? 0 : n;
        });

      const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNum = maxNum + 1;
      return `${prefix}${String(nextNum).padStart(3, '0')}`;
    } catch {
      return `${prefix}001`;
    }
  }

  /**
   * Get all requisitions from Firestore
   */
  static async getAllRequisitions(): Promise<Requisition[]> {
    try {
      const q = query(collection(db, 'requisitions'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Requisition));
    } catch (e) {
      console.warn('Firestore getAllRequisitions error:', e);
      // Fallback query without orderBy in case composite index is still building
      try {
        const snap = await getDocs(collection(db, 'requisitions'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Requisition));
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch {
        return [];
      }
    }
  }

  /**
   * Get single requisition by ID
   */
  static async getRequisitionById(id: string): Promise<Requisition | null> {
    try {
      const docRef = doc(db, 'requisitions', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Requisition;
      }
      
      // Try searching by requisitionCode
      const all = await this.getAllRequisitions();
      return all.find(r => r.id === id || r.requisitionCode === id) || null;
    } catch (e) {
      console.warn('Firestore getRequisitionById error:', e);
      return null;
    }
  }

  /**
   * Query filtered requisitions with search and faceted filters
   */
  static async getFilteredRequisitions(filters: RequisitionFilterParams): Promise<Requisition[]> {
    const all = await this.getAllRequisitions();
    
    return all.filter(req => {
      // Location filter
      if (filters.location && filters.location !== 'all') {
        if (req.locationId !== filters.location && req.locationName !== filters.location) {
          return false;
        }
      }

      // Role filter
      if (filters.role && filters.role !== 'all') {
        const hasRole = req.roles?.some(
          r => r.roleId === filters.role || r.roleName.toLowerCase() === filters.role?.toLowerCase()
        );
        if (!hasRole) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        if (req.status !== filters.status) return false;
      }

      // TA Owner filter
      if (filters.taOwner && filters.taOwner !== 'all') {
        if (req.taOwnerId !== filters.taOwner && req.taOwnerName !== filters.taOwner) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRangePreset && filters.dateRangePreset !== 'all') {
        const matchesDate = matchesDatePreset(
          req.roleOpenDate, 
          filters.dateRangePreset, 
          filters.startDate, 
          filters.endDate
        );
        if (!matchesDate) return false;
      }

      // Search query (Requisition ID, Location, Role, TA owner, Hiring manager, Notes)
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        const codeMatch = req.requisitionCode?.toLowerCase().includes(q);
        const locMatch = req.locationName?.toLowerCase().includes(q);
        const ownerMatch = req.taOwnerName?.toLowerCase().includes(q) || req.taOwnerEmail?.toLowerCase().includes(q);
        const managerMatch = req.hiringManager?.toLowerCase().includes(q);
        const notesMatch = req.notes?.toLowerCase().includes(q);
        const roleMatch = req.roles?.some(r => r.roleName.toLowerCase().includes(q));

        if (!codeMatch && !locMatch && !ownerMatch && !managerMatch && !notesMatch && !roleMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Create a new requisition in Firestore
   */
  static async createRequisition(
    data: Omit<Requisition, 'id' | 'requisitionCode' | 'createdAt' | 'updatedAt' | 'totalPositions'> & { requisitionCode?: string }
  ): Promise<Requisition> {
    const code = data.requisitionCode || await this.generateNextRequisitionCode();
    const id = `req-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Automatically calculate total positions from all assigned roles
    const totalPositions = data.roles.reduce((acc, r) => acc + (Number(r.numberOfPositions) || 0), 0);

    const newRequisition: Requisition = {
      ...data,
      id,
      requisitionCode: code,
      totalPositions,
      createdAt: now,
      updatedAt: now,
      closedAt: data.status === 'Closed' ? now : null
    };

    await setDoc(doc(db, 'requisitions', id), newRequisition);
    return newRequisition;
  }

  /**
   * Update an existing requisition in Firestore
   */
  static async updateRequisition(
    id: string,
    data: Partial<Omit<Requisition, 'id' | 'createdAt'>>
  ): Promise<Requisition> {
    const now = new Date().toISOString();
    const current = await this.getRequisitionById(id);

    if (!current) {
      throw new Error(`Requisition with id ${id} not found`);
    }

    const roles = data.roles || current.roles;
    const totalPositions = roles.reduce((acc, r) => acc + (Number(r.numberOfPositions) || 0), 0);
    
    const status = data.status || current.status;
    let closedAt = current.closedAt;
    if (status === 'Closed' && current.status !== 'Closed') {
      closedAt = now;
    } else if (status !== 'Closed') {
      closedAt = null;
    }

    const updatedRequisition: Requisition = {
      ...current,
      ...data,
      totalPositions,
      status,
      closedAt,
      updatedAt: now
    };

    await updateDoc(doc(db, 'requisitions', id), updatedRequisition as any);
    return updatedRequisition;
  }

  /**
   * Quick status change helper in Firestore
   */
  static async updateRequisitionStatus(
    id: string, 
    status: RequisitionStatus, 
    updatedBy: { id: string; name: string }
  ): Promise<Requisition> {
    return this.updateRequisition(id, {
      status,
      updatedBy: updatedBy.id,
      updatedByName: updatedBy.name
    });
  }

  /**
   * Calculate 5 KPI cards for Dashboard
   */
  static async getDashboardKPIs(): Promise<DashboardKPIs> {
    const all = await this.getAllRequisitions();
    const openReqs = all.filter(r => r.status === 'Open');

    // Total open positions across all open requisitions
    const openPositions = openReqs.reduce((acc, r) => acc + (r.totalPositions || 0), 0);

    // Number of unique locations with active/open requisitions
    const locationsHiring = new Set(openReqs.map(r => r.locationName)).size;

    // Number of unique roles currently being hired in open requisitions
    const rolesSet = new Set<string>();
    openReqs.forEach(r => {
      r.roles?.forEach(role => {
        if (role.numberOfPositions > 0) {
          rolesSet.add(role.roleName);
        }
      });
    });

    // Requisitions opened during current month
    const newThisMonth = all.filter(r => isDateInCurrentMonth(r.roleOpenDate) || isDateInCurrentMonth(r.createdAt)).length;

    return {
      openRequisitions: openReqs.length,
      openPositions,
      locationsHiring,
      rolesHiring: rolesSet.size,
      newThisMonth
    };
  }

  /**
   * Dynamic summaries for all 8 locations
   */
  static async getLocationSummaries(): Promise<LocationHiringSummary[]> {
    const locations = await this.getLocations();
    const all = await this.getAllRequisitions();
    const openReqs = all.filter(r => r.status === 'Open');

    return locations.map(loc => {
      const locOpenReqs = openReqs.filter(r => r.locationId === loc.id || r.locationName === loc.name || r.locationName === loc.code);
      const openPositions = locOpenReqs.reduce((acc, r) => acc + (r.totalPositions || 0), 0);

      return {
        code: loc.code,
        name: loc.name,
        openRequisitions: locOpenReqs.length,
        openPositions
      };
    });
  }

  /**
   * Dynamic summaries for all 5 roles
   */
  static async getRoleSummaries(): Promise<RoleHiringSummary[]> {
    const roles = await this.getRoles();
    const all = await this.getAllRequisitions();
    const openReqs = all.filter(r => r.status === 'Open');

    return roles.map(role => {
      let openPositions = 0;
      let openRequisitions = 0;
      const locationsSet = new Set<string>();

      openReqs.forEach(req => {
        const matched = req.roles?.find(
          r => r.roleId === role.id || r.roleName.toLowerCase() === role.name.toLowerCase()
        );
        if (matched && matched.numberOfPositions > 0) {
          openPositions += Number(matched.numberOfPositions);
          openRequisitions += 1;
          locationsSet.add(req.locationName);
        }
      });

      return {
        roleId: role.id,
        roleName: role.name,
        openPositions,
        openRequisitions,
        locations: Array.from(locationsSet)
      };
    });
  }
}
