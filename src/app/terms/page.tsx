import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../legal.module.css";

export const metadata = {
  title: "Terms of Service — Relay",
  description: "The terms that govern your use of Relay.",
};

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Back to home
        </Link>

        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: June 11, 2026</p>

        <div className={styles.body}>
          <p>
            These Terms of Service govern your use of Relay, a service that lets organizations run
            automated WhatsApp assistants. By creating an account or using Relay, you agree to these
            terms. If you don&apos;t agree, please don&apos;t use the service.
          </p>

          <h2>Acceptable use</h2>
          <p>
            You may use Relay only for lawful purposes and in line with these terms. You agree not to
            misuse the service, interfere with its operation, attempt to access it in unauthorized
            ways, or use it to harm others.
          </p>

          <h2>WhatsApp and Meta policies</h2>
          <p>
            Relay runs on top of WhatsApp. You are responsible for complying with all applicable
            WhatsApp and Meta policies, including their Business and Commerce policies. In
            particular, you agree not to use Relay to:
          </p>
          <ul>
            <li>send spam, bulk unsolicited messages, or messages to people who haven&apos;t opted in;</li>
            <li>share illegal, deceptive, abusive, or otherwise prohibited content; or</li>
            <li>violate the rights of others or any applicable law.</li>
          </ul>
          <p>
            Failure to follow these policies may result in suspension of your account by us or by
            WhatsApp/Meta.
          </p>

          <h2>Accounts and subscriptions</h2>
          <p>
            You are responsible for keeping your account credentials secure and for all activity
            under your account. Paid plans are billed on the cycle shown at sign-up. You can cancel
            at any time, and cancellation takes effect at the end of your current billing period.
            Fees already paid are non-refundable except where required by law.
          </p>

          <h2>Service provided &ldquo;as is&rdquo;</h2>
          <p>
            Relay is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
            warranties of any kind, whether express or implied. We do not guarantee that the service
            will be uninterrupted, error-free, or that the replies generated will always be accurate.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Relay and its providers will not be liable for any
            indirect, incidental, or consequential damages, or for any loss of data, revenue, or
            profits arising from your use of the service. Our total liability for any claim relating to
            the service will not exceed the amount you paid us in the three months before the claim.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may update these terms from time to time. If we make material changes, we will update
            the date above and, where appropriate, notify you. Continued use of Relay after changes
            take effect means you accept the updated terms.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about these terms? Email us at{" "}
            <a href="mailto:support@relay.app">support@relay.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
