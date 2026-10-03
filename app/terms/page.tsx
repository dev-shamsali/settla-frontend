import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Terms" };
export default function Page() {
  return (
    <LegalPage title="Terms of service" updated="Template — have counsel review before launch">
      <p>These terms are a starting template and are not legal advice.</p>
      <h2>Service</h2><p>Settla provides an AI-assisted payment resolution console. Financial actions are executed only within the policies, limits and permissions you configure, and are verified after execution.</p>
      <h2>Your responsibilities</h2><p>You are responsible for policy configuration, credential custody, and reviewing escalations and approvals.</p>
      <h2>Availability</h2><p>Replace with your SLA.</p>
    </LegalPage>
  );
}
