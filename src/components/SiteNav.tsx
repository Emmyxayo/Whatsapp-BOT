"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import styles from "../app/page.module.css";

export default function SiteNav({ startHref }: { startHref: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
      <div className={`${styles.container} ${styles.navInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <MessagesSquare size={18} strokeWidth={2.25} />
          </span>
          Relay
        </Link>
        <div className={styles.navLinks}>
          <a href="#how" className={`${styles.navLink} ${styles.navLinkHideSm}`}>
            How it works
          </a>
          <a href="#pricing" className={`${styles.navLink} ${styles.navLinkHideSm}`}>
            Pricing
          </a>
          <a href="#faq" className={`${styles.navLink} ${styles.navLinkHideSm}`}>
            FAQ
          </a>
          <Link href={startHref} className={`${styles.navLink} ${styles.navLinkHideSm}`}>
            Sign in
          </Link>
          <Link href={startHref} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
