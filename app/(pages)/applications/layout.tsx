export const dynamic = "force-dynamic";

export default function ApplicationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full space-y-4">{children}</div>;
}
