import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../legal.module.css";

export const metadata = {
  title: "Privacy Policy — Relay",
  description: "How Relay handles your organization's information and the messages your members send.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Back to home
        </Link>

        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 11, 2026</p>

        <div className={styles.body}>
          <p>
            Relay helps organizations run automated assistants on WhatsApp. This policy explains, in
            plain language, what information we handle, how we use it, and the choices you have. By
            using Relay, you agree to the practices described here.
          </p>

          <h2>What information we handle</h2>
          <p>We handle two main kinds of information:</p>
          <ul>
            <li>
              <strong>Organization information.</strong> The details you enter to set up your
              assistant — such as your hours, services, prices, common answers, and contact details.
            </li>
            <li>
              <strong>WhatsApp messages.</strong> The messages your members and customers send to
              reach your assistant, along with the replies it generates.
            </li>
          </ul>

          <h2>How we use your information</h2>
          <p>
            We process incoming WhatsApp messages so your assistant can understand them and generate
            a helpful reply. The messages and your organization information are used to produce those
            responses and to operate, maintain, and improve the service. We do not use this
            information for unrelated purposes.
          </p>

          <h2>Service providers we rely on</h2>
          <p>
            We use a small number of trusted providers to run Relay:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> for secure storage of your organization information and
              message data.
            </li>
            <li>
              <strong>Anthropic&apos;s Claude</strong> to generate the replies your assistant sends.
              Messages are sent to Claude only to produce a response.
            </li>
          </ul>

          <h2>We don&apos;t sell your data</h2>
          <p>
            We do not sell personal data, and we do not share it with third parties for their own
            marketing. We only share information with the service providers above as needed to run
            Relay, or when required by law.
          </p>

          <h2>Responsibility for member data</h2>
          <p>
            Each organization is responsible for the data of its own members and customers —
            including having the right to send and process their messages through Relay, and for
            telling them how their information is used. Relay acts on your behalf in handling that
            data.
          </p>

          <h2>Contact us</h2>
          <p>
            If you have any questions about this policy or your data, email us at{" "}
            <a href="mailto:support@relay.app">support@relay.app</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
