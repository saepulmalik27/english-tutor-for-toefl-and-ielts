import { getSessionUser } from "@/lib/auth";
import OnboardingTest from "@/components/OnboardingTest";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  
  if (!user) {
    redirect("/login");
  }

  // If already onboarded, redirect directly to dashboard
  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  return <OnboardingTest />;
}
