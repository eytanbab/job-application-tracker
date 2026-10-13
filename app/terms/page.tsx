import type { Metadata } from "next";
import {
  InlineLink,
  LegalDocument,
  LegalList,
  LegalSection,
} from "@/app/_components/legal-document";

export const metadata: Metadata = {
  title: "JAT | Terms of Service",
  description: "The terms for using Job Application Tracker.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" lastUpdated="[Month DD, YYYY]">
      <LegalSection title="Agreement">
        <p>
          These terms apply to your use of Job Application Tracker (&quot;the app&quot;),
          operated by [operator name] (&quot;we&quot;). By using the app you agree to them.
          If you don&apos;t agree, please don&apos;t use the app. Our{" "}
          <InlineLink href="/privacy">Privacy Policy</InlineLink> explains how we handle
          your data.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          The app helps you track job applications, analyze your job search, store
          resumes, and use AI features that fill in applications from job links and
          compare resumes with job descriptions. It is provided [free of charge]. We may
          change, limit or discontinue features at any time.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and guest workspaces">
        <LegalList>
          <li>
            You can use the app as a guest. Guest data is tied to one browser through a
            cookie, is lost if you clear your cookies, and is deleted automatically after
            90 days without activity. Sign in to keep it.
          </li>
          <li>
            Signed-in accounts are managed by Clerk. Keep your sign-in details secure; you
            are responsible for activity under your account.
          </li>
          <li>AI features are available to signed-in users only and may be rate limited.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You own what you add to the app, including applications, notes and uploaded
          documents. You give us permission to store, process and display it only as
          needed to run the app for you, including sending it to our service providers
          (such as Google&apos;s Gemini API when you use an AI feature). You can export or
          delete your content at any time from{" "}
          <InlineLink href="/settings">Settings</InlineLink>.
        </p>
        <p>
          Only upload content you have the right to use, and don&apos;t upload other
          people&apos;s personal data without their permission.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <LegalList>
          <li>use the app for anything unlawful, or to store unlawful content;</li>
          <li>upload malware or files designed to harm the app or other users;</li>
          <li>
            try to access other users&apos; data, get around security or rate limits, or
            overload the service, including with automated requests;
          </li>
          <li>use the app to scrape websites in ways their terms don&apos;t allow.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="AI output">
        <p>
          AI features can be wrong or incomplete. Check autofilled details against the
          original job posting, and treat ATS scores and suggestions as estimates. They
          are not produced by, or affiliated with, any employer or applicant tracking
          system.
        </p>
      </LegalSection>

      <LegalSection title="Third-party sites">
        <p>
          Job links and job boards belong to third parties. We aren&apos;t responsible for
          their content, availability or practices.
        </p>
      </LegalSection>

      <LegalSection title="Ending your use">
        <p>
          You can stop using the app and delete your account or guest data at any time.
          We may suspend or close access if you break these terms or use the app in a way
          that could harm it or others.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers and liability">
        <p>
          The app is provided &quot;as is&quot; and &quot;as available&quot;, without
          warranties of any kind. Keep your own copies of anything important; use the
          export in Settings. To the extent the law allows, we aren&apos;t liable for
          indirect or consequential losses, or for lost data or opportunities, arising
          from your use of the app. [Have this section reviewed for your jurisdiction.]
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          We may update these terms and will revise the date above when we do. Continuing
          to use the app after a change means you accept the new terms. These terms are
          governed by the laws of [jurisdiction]. Questions: [contact email].
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
