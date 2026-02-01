/**
 * Formats a date string (ISO) into "DD MON YYYY" format (e.g. "01 JAN 2024").
 * Month names are in English and uppercase.
 * Takes string input to ensure consistency with payload data.
 */
export function formatReportDateFromISO(isoDateString: string): string {
  const date = new Date(isoDateString);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid ISO date string provided');
  }

  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  
  const monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  const month = monthNames[date.getMonth()];

  return `${day} ${month} ${year}`;
}
