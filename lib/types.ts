export type Data = {
  year: string;
  month: string;
  numOfApplications: number;
};

export type RawData = {
  year: string;
  month: string;
  status: string;
  statusCount: number;
};

export type ChartData = {
  month: string;
  [status: string]: number | string; // Dynamic keys for different statuses
};
