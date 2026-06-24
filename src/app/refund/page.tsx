import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../legal.module.css";

export const metadata = {
  title: "Refund Policy — Relay",
  description: "How billing, cancellations, and refunds work for your Relay subscription.",
};

export default function RefundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} strokeWidth={2.25} />
          Back to home
        </Link>

        <h1 className={styles.title}>Refund Policy</h1>
        <p className={styles.updated}>Last updated: June 23, 2026</p>

        <div className={styles.body}>
          <p>
            This policy explains, in plain language, how billing and refunds work for Relay. We aim
            to keep it simple and fair. If anything here is unclear, just email us — we&apos;re happy
            to help.
          </p>

          <h2>How billing works</h2>
          <p>
            Relay subscriptions are billed monthly. Each payment covers one month of access to your
            plan, charged at the start of the billing period. Your plan renews automatically each
            month until you cancel.
          </p>

          <h2>If you cancel</h2>
          <p>
            You can cancel at any time. When you cancel, your assistant stays active until the end of
            the period you&apos;ve already paid for — you keep full access until then, and you
            won&apos;t be charged again. We do not provide partial-month refunds by default, so
            cancelling part-way through a month does not refund the remaining days.
          </p>

          <h2>Requesting a refund or reporting a billing issue</h2>
          <p>
            If you were charged in error, billed twice, or believe something went wrong with a
            payment, email us at{" "}
            <a href="mailto:emmyoyebade@gmail.com">emmyoyebade@gmail.com</a> with your account details
            and what happened. We&apos;ll review every request and put right any genuine billing
            mistake.
          </p>

          <h2>Setup fees and WhatsApp number costs</h2>
          <p>
            Some plans may include one-off setup fees or the cost of provisioning a WhatsApp number.
            Once that work has been done and the number provisioned, those amounts are non-refundable,
            since the cost has already been incurred on your behalf. We&apos;ll always tell you about
            any such fees before you commit to them.
          </p>

          <h2>Your statutory rights</h2>
          <p>
            Nothing in this policy limits any refund rights you have under applicable law. Where the
            law requires a refund, we will honour it.
          </p>

          <h2>Contact us</h2>
          <p>
            Questions about billing or refunds? Email us at{" "}
            <a href="mailto:emmyoyebade@gmail.com">emmyoyebade@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
