import Link from "next/link";
import { TriangleAlert } from "lucide-react";

// Shared layout and typography for the /privacy and /terms pages.

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="p-4 sm:p-6 w-full min-w-0">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div
          role="note"
          className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Template — review before publishing</p>
            <p>
              This draft describes how the app works today. Fill in the bracketed
              details, check it against the laws that apply to you, and have it
              reviewed before relying on it.
            </p>
          </div>
        </div>

        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
          {children}
        </div>

        <footer className="border-t border-border/40 pt-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground hover:underline underline-offset-4">
            Privacy Policy
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <Link href="/terms" className="hover:text-foreground hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <Link href="/settings" className="hover:text-foreground hover:underline underline-offset-4">
            Settings
          </Link>
        </footer>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-muted-foreground">{children}</ul>;
}

export function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </a>
  ) : (
    <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
