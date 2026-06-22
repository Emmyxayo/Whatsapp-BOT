"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import styles from "./DemoChat.module.css";

/*
  TODO: This is a styled, hand-built representation of a Relay conversation.
  When you have real WhatsApp screenshots, you can drop them in here instead —
  e.g. replace the <div className={styles.card}> block with an <Image /> of a
  genuine screenshot (or a small carousel of them). The copy below is real
  example output, so it can stay as a fallback.
*/

type Msg = { from: "member" | "bot"; text: string };

const SCRIPT: Msg[] = [
  { from: "member", text: "What time are your services?" },
  {
    from: "bot",
    text:
      "Sunday services are at 8am and 10am, and midweek service is Wednesday at 6pm.",
  },
  { from: "member", text: "Where are you located?" },
  {
    from: "bot",
    text:
      "We're at 12 Emmanuel Street, near the Pastors' Lodge, Redemption City of God, Lagos.",
  },
  { from: "member", text: "Can I speak to someone?" },
  {
    from: "bot",
    text:
      "Of course — I've passed your message to the team and someone will reach out to you shortly.",
  },
];

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

export default function DemoChat() {
  const reduced = usePrefersReducedMotion();
  // How many messages are currently visible.
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reveal everything immediately when motion is reduced.
  useEffect(() => {
    if (reduced) setShown(SCRIPT.length);
  }, [reduced]);

  // Start the animation only once the card scrolls into view.
  useEffect(() => {
    if (reduced) return;
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // Stagger the messages in. Bot replies wait a touch longer (as if "typing").
  useEffect(() => {
    if (reduced || !started) return;
    const clear = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clear();
    let acc = 400;
    SCRIPT.forEach((m, i) => {
      acc += m.from === "bot" ? 1100 : 800;
      timers.current.push(setTimeout(() => setShown(i + 1), acc));
    });
    return clear;
  }, [reduced, started]);

  return (
    <div className={styles.stage} ref={rootRef}>
      <div className={styles.glow} aria-hidden />
      <div
        className={styles.card}
        role="img"
        aria-label="Example WhatsApp conversation: a member asks about service times, location and reaching a person, and the Relay assistant answers each one."
      >
        <header className={styles.head}>
          <div className={styles.avatar}>G</div>
          <div className={styles.headText}>
            <span className={styles.orgName}>Grace Assembly</span>
            <span className={styles.status}>
              <span className={styles.dot} aria-hidden />
              online
            </span>
          </div>
        </header>

        <div className={styles.thread}>
          {SCRIPT.map((m, i) => {
            const visible = i < shown;
            const isBot = m.from === "bot";
            return (
              <div
                key={i}
                className={`${styles.row} ${isBot ? styles.right : styles.left}`}
              >
                <div
                  className={`${styles.bubble} ${
                    isBot ? styles.outbound : styles.inbound
                  } ${visible ? styles.show : ""}`}
                >
                  {m.text}
                  {isBot && (
                    <span className={styles.meta}>
                      now <Check size={13} strokeWidth={2.5} className={styles.tick} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.composer} aria-hidden>
          <span className={styles.composerText}>Message</span>
          <span className={styles.send} />
        </div>
      </div>
    </div>
  );
}
