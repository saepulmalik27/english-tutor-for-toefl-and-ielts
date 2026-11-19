import { redirect } from "next/navigation";
import { getLearner } from "@/lib/learner";
import Welcome from "@/components/Welcome";

export default async function OnboardingPage() {
  const learner = await getLearner();
  if (learner.isOnboarded) redirect("/dashboard");
  return <Welcome />;
}
