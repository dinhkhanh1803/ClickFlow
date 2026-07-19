export function greetingForDate(date = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const dashboardDateLabel = (date = new Date()) => new Intl.DateTimeFormat(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
}).format(date);
