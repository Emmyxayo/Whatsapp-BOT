"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import styles from "./ChatCard.module.css";

type Phase = "start" | "member" | "typing" | "reply";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function ChatCard() {
  const [phase, setPhase] = useState<Phase>("start");
  const reduced = usePrefersReducedMotion();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // With reduced motion, show the finished conversation, no looping.
    if (reduced) {
      setPhase("reply");
      return;
    }

    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const run = () => {
      clear();
      setPhase("start");
      timers.current.push(
        setTimeout(() => setPhase("member"), 500),
        setTimeout(() => setPhase("typing"), 1700),
        setTimeout(() => setPhase("reply"), 3300)
      );
    };

    run();
    const loop = setInterval(run, 6000);
    return () => {
      clearInterval(loop);
      clear();
    };
  }, [reduced]);

  const memberShown = phase === "member" || phase === "typing" || phase === "reply";
  const typingShown = phase === "typing";
  const replyShown = phase === "reply";

  return (
    <div className={styles.stage}>
      <div className={styles.glow} aria-hidden />
      <div className={styles.card} role="img" aria-label="Example WhatsApp conversation: a customer asks the opening time and Relay replies instantly.">
        <header className={styles.head}>
          <div className={styles.avatar}>R</div>
          <div className={styles.headText}>
            <span className={styles.orgName}>Riverside Clinic</span>
            <span className={styles.status}>
              <span className={styles.dot} aria-hidden />
              online
            </span>
          </div>
        </header>

        <div className={styles.thread}>
          <div className={`${styles.row} ${styles.left}`}>
            <div className={`${styles.bubble} ${styles.inbound} ${memberShown ? styles.show : ""}`}>
              Hi 👋 what time do you open today?
            </div>
          </div>

          <div className={`${styles.row} ${styles.right}`}>
            {!replyShown && (
              <div className={`${styles.bubble} ${styles.typing} ${typingShown ? styles.show : ""}`} aria-hidden>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}
            {replyShown && (
              <div className={`${styles.bubble} ${styles.outbound} ${styles.show}`}>
                Hi! We&apos;re open 9am–5pm today. Want directions or to book a slot?
                <span className={styles.meta}>
                  9:24 <Check size={13} strokeWidth={2.5} className={styles.tick} />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.composer} aria-hidden>
          <span className={styles.composerText}>Message</span>
          <span className={styles.send} />
        </div>
      </div>
    </div>
  );
}
