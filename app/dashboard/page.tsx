import { getSession } from "@/lib/discord-auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getSession();
  if (!user) redirect("/");

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        siteName: user.siteName || user.name,
        image: user.image,
        email: user.email || null,
      }}
    />
  );
}
