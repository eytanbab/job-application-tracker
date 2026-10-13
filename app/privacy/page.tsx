import type { Metadata } from "next";
import {
  InlineLink,
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/app/_components/legal-document";

export const metadata: Metadata = {
  title: "JAT | Privacy Policy",
  description: "How Job Application Tracker collects, uses and deletes your data.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" lastUpdated="[Month DD, YYYY]">
      <LegalSection title="Who we are">
        <p>
          Job Application Tracker (&quot;the app&quot;, &quot;we&quot;) is operated by{" "}
          [operator name], [address]. If you have a question about this policy or your
          data, contact us at [contact email].
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <LegalList>
          <li>
            <strong>Account details</strong> (signed-in users): your name, email address
            and sign-in identifiers, held by our authentication provider, Clerk.
          </li>
          <li>
            <strong>What you enter</strong>: job applications (role, company, job link,
            platform, location, salary, description, notes, dates and status) and the
            history of status changes.
          </li>
          <li>
            <strong>Documents</strong>: PDF resumes you upload, with their title, file
            name and size.
          </li>
          <li>
            <strong>Guest session</strong>: if you use the app without signing in, a
            random identifier stored in a signed cookie links you to your guest data.
          </li>
          <li>
            <strong>Technical logs</strong>: our hosting provider records standard
            request logs (such as IP address, browser and time) to run and secure the
            service.
          </li>
        </LegalList>
        <p>We don&apos;t sell your data, show ads, or use advertising or analytics cookies.</p>
      </LegalSection>

      <LegalSection title="How we use it">
        <LegalList>
          <li>To store, display and analyze your job search in the app.</li>
          <li>
            To run the AI features you choose to use (see below). AI features are
            available to signed-in users only.
          </li>
          <li>To keep the service secure and prevent abuse, such as rate limiting.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="AI processing">
        <p>When you are signed in and use an AI feature, we send content to Google&apos;s Gemini API:</p>
        <LegalList>
          <li>
            <strong>Autofill from a job link</strong>: the text of the job posting page.
            Postings on supported job boards are read without AI. To read a page we may
            fetch it directly or through a page-reading service such as Jina AI Reader;
            only the job link is sent to that service.
          </li>
          <li>
            <strong>ATS resume checker</strong>: your resume text and the job description
            you provide.
          </li>
        </LegalList>
        <p>
          Google processes this content under the{" "}
          <InlineLink href="https://ai.google.dev/gemini-api/terms">Gemini API terms</InlineLink>.
          [State whether the API is used on a paid tier, where Google does not use
          prompts to improve its products, or a free tier, where it may.]
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>We use these providers to run the app. They process data on our behalf:</p>
        <LegalList>
          <li><strong>Clerk</strong>: sign-in and account management.</li>
          <li><strong>Neon</strong>: PostgreSQL database for applications, status history and document details.</li>
          <li><strong>Amazon Web Services (S3)</strong>: storage for uploaded files, in a private bucket.</li>
          <li><strong>Google (Gemini API)</strong>: AI processing described above.</li>
          <li><strong>Vercel</strong>: hosting and scheduled jobs.</li>
          <li>[Add any error monitoring or other provider you enable, for example Sentry.]</li>
        </LegalList>
        <p>[List the regions where these providers store data.]</p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <LegalList>
          <li>
            <strong>guest_id</strong>: a signed, random identifier for guest workspaces.
            HTTP-only, kept for up to one year, and removed when you sign in or delete
            your guest data.
          </li>
          <li><strong>Clerk session cookies</strong>: keep you signed in.</li>
          <li>
            <strong>Local storage</strong>: your theme choice and whether you dismissed
            the guest notice. This stays in your browser.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="How long we keep data">
        <LegalList>
          <li>
            <strong>Signed-in users</strong>: until you delete it or delete your account.
          </li>
          <li>
            <strong>Guests</strong>: guest data lives in one browser. It is deleted
            automatically, including uploaded files, after 90 days without activity
            (adding an application, changing a status or uploading a document). If you
            clear your cookies, you lose access to it. Sign in to keep it.
          </li>
          <li>
            Database backups kept by our providers may hold deleted data for up to
            [backup retention period] before it is overwritten.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <LegalList>
          <li>
            <strong>Export</strong>: download your applications, status history and
            document details as JSON, or your applications as CSV, from{" "}
            <InlineLink href="/settings">Settings</InlineLink>.
          </li>
          <li>
            <strong>Delete</strong>: delete your account, or your guest data, from{" "}
            <InlineLink href="/settings">Settings</InlineLink>. This immediately removes
            your applications, status history, documents and uploaded files, and closes
            your Clerk account.
          </li>
          <li>
            <strong>Correct</strong>: edit any application or document in the app, and
            your profile from Settings.
          </li>
          <li>
            For other requests, or to complain about how we handle your data, contact
            [contact email]. [Add the rights and supervisory authority that apply in your
            jurisdiction, for example under the GDPR or CCPA.]
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Traffic is encrypted with HTTPS. Guest cookies are signed so they can&apos;t be
          forged, and uploaded files are stored privately and shared only through
          short-lived links. No system is perfectly secure, so please don&apos;t upload
          anything you aren&apos;t comfortable storing online.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>The app is not intended for children under 16, and we don&apos;t knowingly collect their data.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We&apos;ll update this page when our practices change and revise the date above.
          For significant changes we&apos;ll [describe how you will notify users].
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
