"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      onClick={toTop}
      className={`${styles.btn} ${visible ? styles.visible : ""}`}
    >
      <ArrowUp size={20} strokeWidth={2.25} />
    </button>
  );
}
