import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getSessionUser();
  
  if (user) {
    if (!user.isOnboarded) {
      redirect("/onboarding");
    }
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
