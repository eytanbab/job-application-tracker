import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChartData, Data, RawData } from './types';

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

const MONTHS_MAP: Record<string, string> = {
  '1': 'Jan',
  '2': 'Feb',
  '3': 'Mar',
  '4': 'Apr',
  '5': 'May',
  '6': 'Jun',
  '7': 'Jul',
  '8': 'Aug',
  '9': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
};

export function transformApplicationsData(
  rawData: RawData[],
  selectedYear: string
): ChartData[] {
  // Filter data for the selected year
  const filteredData = rawData.filter((entry) => entry.year === selectedYear);

  // Group data by month
  const groupedData: Record<string, ChartData> = {};

  filteredData.forEach(({ month, status, statusCount }) => {
    const monthName = MONTHS_MAP[month];

    if (!groupedData[monthName]) {
      groupedData[monthName] = { month: monthName };
    }

    groupedData[monthName][status] = statusCount;
  });

  // Ensure all months exist and missing statuses are filled with 0
  const allMonths = Object.values(MONTHS_MAP);
  const uniqueStatuses = [...new Set(rawData.map(({ status }) => status))];

  const chartData = allMonths.map((month) => {
    const data = groupedData[month] || { month };
    uniqueStatuses.forEach((status) => {
      if (!data[status]) data[status] = 0; // Ensure missing statuses are 0
    });
    return data;
  });

  return chartData;
}
