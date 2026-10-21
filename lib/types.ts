import { FormValues } from "@/app/_components/application-form";
import { insertApplicationSchema } from "@/app/db/schema";
import { z } from "zod";
import type { AiAccessErrorCode } from "@/lib/ai-quota";

/* ------ Open AI ------------*/
type SuccessData = {
  status: "success";
  application: FormValues;
};

type FailData = {
  status: "fail";
  message: string;
  code?: AiAccessErrorCode;
  /** Set with code "rate_limited". */
  limit?: number;
  resetAt?: string;
};

export type AiData = SuccessData | FailData;

export type AiFormValues = z.input<typeof insertApplicationSchema>;
