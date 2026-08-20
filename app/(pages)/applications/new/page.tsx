import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    title: "JobTracker | New Application",
  };
}

export default function NewApplicationPage() {
  redirect("/applications?create=true");
}
