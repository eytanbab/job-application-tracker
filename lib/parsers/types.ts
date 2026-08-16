export interface ParsedJob {
  role_name: string;
  company_name: string;
  link: string;
  platform: string;
  status: string;
  description: string;
  location: string;
  salary?: string;
}

export type ParseResult = {
  success: true;
  data: ParsedJob;
  source: "api" | "json-ld" | "dom" | "meta";
} | {
  success: false;
  error?: string;
};
