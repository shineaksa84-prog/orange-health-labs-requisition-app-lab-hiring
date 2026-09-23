import { format, differenceInCalendarDays, parseISO, isValid, isThisMonth, isToday, isThisWeek } from 'date-fns';

/**
 * Calculates human-readable age for a requisition based on its open date and status/closed date.
 */
export function calculateRequisitionAge(openDateStr: string, status: string, closedDateStr?: string | null): string {
  try {
    if (!openDateStr) return '—';
    
    const openDate = typeof openDateStr === 'string' ? parseISO(openDateStr) : new Date(openDateStr);
    if (!isValid(openDate)) return '—';

    // If closed or cancelled and closedDate exists
    if ((status === 'Closed' || status === 'Cancelled') && closedDateStr) {
      const closedDate = typeof closedDateStr === 'string' ? parseISO(closedDateStr) : new Date(closedDateStr);
      if (isValid(closedDate)) {
        const days = Math.max(0, differenceInCalendarDays(closedDate, openDate));
        if (days === 0) return 'Closed on day 0';
        if (days === 1) return 'Open for 1 day';
        return `Open for ${days} days`;
      }
    }

    const today = new Date();
    const daysOpen = differenceInCalendarDays(today, openDate);

    if (daysOpen < 0) {
      return `Opens in ${Math.abs(daysOpen)} days`;
    }
    if (daysOpen === 0) {
      return 'Opened today';
    }
    if (daysOpen === 1) {
      return '1 day open';
    }
    return `${daysOpen} days open`;
  } catch (err) {
    console.error('Error calculating requisition age:', err);
    return '—';
  }
}

/**
 * Short date format: '23 Sep 2026' or '23 Sep'
 */
export function formatShortDate(dateStr: string | Date | undefined, includeYear: boolean = true): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '—';
    return format(d, includeYear ? 'd MMM yyyy' : 'd MMM');
  } catch {
    return '—';
  }
}

/**
 * Long date format: '23 September 2026'
 */
export function formatLongDate(dateStr: string | Date | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '—';
    return format(d, 'd MMMM yyyy');
  } catch {
    return '—';
  }
}

/**
 * DateTime format: '23 September 2026, 5:10 PM'
 */
export function formatDateTime(dateStr: string | Date | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(d)) return '—';
    return format(d, "d MMMM yyyy, h:mm a");
  } catch {
    return '—';
  }
}

/**
 * Check if a date string is in the current calendar month
 */
export function isDateInCurrentMonth(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return isValid(d) && isThisMonth(d);
  } catch {
    return false;
  }
}

/**
 * Filter date preset checker
 */
export function matchesDatePreset(dateStr: string, preset: string, customStart?: string, customEnd?: string): boolean {
  if (!preset || preset === 'all') return true;
  if (!dateStr) return false;
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return false;

    if (preset === 'today') {
      return isToday(d);
    }
    if (preset === 'this_week') {
      return isThisWeek(d, { weekStartsOn: 1 });
    }
    if (preset === 'this_month') {
      return isThisMonth(d);
    }
    if (preset === 'custom' && customStart) {
      const start = parseISO(customStart);
      if (customEnd) {
        const end = parseISO(customEnd);
        return d >= start && d <= end;
      }
      return d >= start;
    }
    return true;
  } catch {
    return true;
  }
}
