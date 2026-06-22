"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import styles from "./Faq.module.css";

type Item = { q: string; a: string };

const ITEMS: Item[] = [
  {
    q: "Do I need any coding or technical skill?",
    a: "No. You just type your information into a simple dashboard — your hours, location, prices, common answers — and Relay handles the rest.",
  },
  {
    q: "Do I need a WhatsApp Business account or number?",
    a: "Yes, you'll need a dedicated WhatsApp number for your assistant. We help you set it up as part of getting you live.",
  },
  {
    q: "Can I update my information anytime?",
    a: "Yes — instantly. Change a service time or a price in your dashboard and your assistant starts using the new answer right away.",
  },
  {
    q: "What happens if the assistant doesn't know an answer?",
    a: "It says so honestly and offers to pass your message to the team. It never guesses or makes things up — it only answers from the information you've given it.",
  },
  {
    q: "Can a human take over?",
    a: "Yes. Relay flags messages that need a person and hands them off to your team, so nothing important falls through the cracks.",
  },
  {
    q: "How long does setup take?",
    a: "Most organizations are live the same day. Add your information, connect your number, and your assistant starts answering.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={styles.list}>
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className={styles.question}>{item.q}</span>
              <span className={styles.icon} aria-hidden>
                {isOpen ? <Minus size={18} strokeWidth={2.25} /> : <Plus size={18} strokeWidth={2.25} />}
              </span>
            </button>
            <div className={styles.answerWrap} hidden={!isOpen}>
              <p className={styles.answer}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
