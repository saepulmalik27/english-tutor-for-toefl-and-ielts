import { getLearner } from "@/lib/learner";
import OnboardingTest from "@/components/OnboardingTest";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getLearner();
  

  // If already onboarded, redirect directly to dashboard
  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  return <OnboardingTest />;
}
