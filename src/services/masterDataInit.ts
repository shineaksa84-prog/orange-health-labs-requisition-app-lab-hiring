import { LocationMaster, RoleMaster } from '../types';
import { db } from '../firebase/config';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

export const STANDARD_LOCATIONS: LocationMaster[] = [
  { id: 'BLR1', code: 'BLR1', name: 'BLR 1', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'BLR2', code: 'BLR2', name: 'BLR 2', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'NRL', code: 'NRL', name: 'NRL', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'HYD', code: 'HYD', name: 'HYD', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'MUM', code: 'MUM', name: 'MUM', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'PUN', code: 'PUN', name: 'PUN', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'GGN', code: 'GGN', name: 'GGN', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'NOIDA', code: 'NOIDA', name: 'NOIDA', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

export const STANDARD_ROLES: RoleMaster[] = [
  { id: 'role-junior-lab-tech', name: 'Junior Lab Technician', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'role-lab-tech', name: 'Lab Technician', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'role-senior-lab-tech', name: 'Senior Lab Technician', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'role-accession-officer', name: 'Accession Officer', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'role-shift-lead', name: 'Shift Lead', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'role-intern', name: 'Intern', active: true, createdAt: '2026-01-01T00:00:00.000Z' },
];

/**
 * Initializes master data in Firestore if not already populated.
 */
export async function initializeFirestoreMasters(): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const loc of STANDARD_LOCATIONS) {
      const ref = doc(db, 'locations', loc.id);
      batch.set(ref, loc, { merge: true });
    }

    for (const role of STANDARD_ROLES) {
      const ref = doc(db, 'roles', role.id);
      batch.set(ref, role, { merge: true });
    }

    await batch.commit();
  } catch (err) {
    console.warn('Firestore master init check:', err);
  }
}
