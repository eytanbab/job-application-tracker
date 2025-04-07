import { FormValues } from '@/app/_components/application-form';
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
type SuccessData = {
  status: 'success';
  application?: FormValues;
};

type FailData = {
  status: 'fail';
  message: string;
};

export type AiData = SuccessData | FailData;

export type AiFormValues = z.input<typeof insertApplicationSchema>;
