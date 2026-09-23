import { Requisition } from '../types';
import { formatLongDate, formatDateTime } from './dateUtils';

/**
 * Generates and triggers download of CSV formatted with one row per role for clean downstream analytics.
 */
export function exportRequisitionsToCSV(requisitions: Requisition[], filenamePrefix: string = 'Orange_Health_Lab_Requisitions'): void {
  const headers = [
    'Requisition ID',
    'Location',
    'Role',
    'Number of Positions',
    'Total Requisition Positions',
    'Role Open Date',
    'Status',
    'TA Owner',
    'TA Owner Email',
    'Hiring Manager',
    'Notes',
    'Created At',
    'Updated At',
    'Closed At'
  ];

  const rows: string[][] = [];

  requisitions.forEach(req => {
    if (!req.roles || req.roles.length === 0) {
      rows.push([
        req.requisitionCode || '',
        req.locationName || '',
        'None',
        '0',
        String(req.totalPositions || 0),
        formatLongDate(req.roleOpenDate),
        req.status,
        req.taOwnerName || '',
        req.taOwnerEmail || '',
        req.hiringManager || '',
        (req.notes || '').replace(/"/g, '""'),
        formatDateTime(req.createdAt),
        formatDateTime(req.updatedAt),
        req.closedAt ? formatDateTime(req.closedAt) : ''
      ]);
    } else {
      req.roles.forEach(role => {
        rows.push([
          req.requisitionCode || '',
          req.locationName || '',
          role.roleName || '',
          String(role.numberOfPositions || 0),
          String(req.totalPositions || 0),
          formatLongDate(req.roleOpenDate),
          req.status,
          req.taOwnerName || '',
          req.taOwnerEmail || '',
          req.hiringManager || '',
          (req.notes || '').replace(/"/g, '""'),
          formatDateTime(req.createdAt),
          formatDateTime(req.updatedAt),
          req.closedAt ? formatDateTime(req.closedAt) : ''
        ]);
      });
    }
  });

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
