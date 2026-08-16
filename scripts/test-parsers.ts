import fs from "fs";
import path from "path";
import { parseIndeed } from "../lib/parsers/indeed";
import { parseLinkedIn } from "../lib/parsers/linkedin";

async function runTest() {
  const indeedPath = path.join(process.cwd(), "job-postings-examples", "indeed.html");
  const linkedinPath = path.join(process.cwd(), "job-postings-examples", "linkedin.html");

  if (fs.existsSync(indeedPath)) {
    const indeedHtml = fs.readFileSync(indeedPath, "utf-8");
    const result = await parseIndeed("https://il.indeed.com/viewjob?jk=5c3952d5f7cb417d", indeedHtml);
    console.log("\n--- Indeed Parser Result ---");
    console.log(JSON.stringify(result, null, 2));
  }

  if (fs.existsSync(linkedinPath)) {
    const linkedinHtml = fs.readFileSync(linkedinPath, "utf-8");
    const result = await parseLinkedIn("https://www.linkedin.com/jobs/view/4450120741", linkedinHtml);
    console.log("\n--- LinkedIn Parser Result ---");
    console.log(JSON.stringify(result, null, 2));
  }
}

runTest();
