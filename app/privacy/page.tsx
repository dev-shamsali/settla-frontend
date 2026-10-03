import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Privacy" };
export default function Page() {
  return (
    <LegalPage title="Privacy" updated="Template — have counsel review before launch">
      <p>Settla processes payment, order and customer records on behalf of your business. You remain the data controller; Settla acts as processor.</p>
      <h2>What we process</h2><p>Payment identifiers and amounts, order details, customer contact details, and the messages customers send. Customer messages are treated as untrusted data and are never executed as instructions.</p>
      <h2>Minimisation & masking</h2><p>Secrets, tokens, passwords and full card data are never logged. Contact details are shown only to roles with customers:read.</p>
      <h2>Retention & isolation</h2><p>Each tenant&apos;s data is isolated. Audit logs are append-only. Retention periods are configured per tenant.</p>
      <h2>Contact</h2><p>Replace this section with your data protection contact.</p>
    </LegalPage>
  );
}
