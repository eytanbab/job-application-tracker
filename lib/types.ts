import { insertApplicationSchema } from '@/app/db/schema';
import { z } from 'zod';

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

/* ------ Open AI ------------*/
const Application = insertApplicationSchema.omit({
  userId: true,
  date_applied: true,
});

export type Application = z.input<typeof insertApplicationSchema>;

export type AiData = {
  status: 'fail' | 'success';
  application?: Application;
};

export type aiFormSchema = typeof insertApplicationSchema;

export type AiFormValues = z.input<typeof insertApplicationSchema>;
