import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const navItems = [
  {
    url: '/applications',
    name: 'applications',
  },
  {
    url: '/analytics/overview',
    name: 'analytics',
  },
  {
    url: '/documents',
    name: 'documents',
  },
];

export const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export type Data = {
  year: string;
  month: string;
  numOfApplications: number;
};

// --- Format Data to Ensure All Months Exist ---
export function formatApplicationsPerYear(data: Data[]) {
  // Group data by year using a Map
  const groupedByYear = new Map<string, Map<number, number>>();

  data.forEach(({ year, month, numOfApplications }) => {
    if (!groupedByYear.has(year)) groupedByYear.set(year, new Map());
    groupedByYear.get(year)!.set(+month, numOfApplications);
  });

  // Generate the final structured result
  return Array.from(groupedByYear.entries()).flatMap(([year, applications]) =>
    Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return {
        year,
        month: monthNames[index], // Convert to 'Jan', 'Feb', etc.
        numOfApplications: applications.get(month) || 0, // Use existing data or default to 0
      };
    })
  );
}
