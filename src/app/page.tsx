import Link from "next/link";
import {
  MessagesSquare,
  PencilLine,
  Smartphone,
  Zap,
  Clock,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ChatCard from "@/components/ChatCard";
import Reveal from "@/components/Reveal";
import styles from "./page.module.css";

const chips = ["Churches", "Schools", "Real estate", "Shops", "Clinics", "Associations"];

const steps = [
  {
    icon: PencilLine,
    title: "Add your information",
    text: "Enter your hours, services, prices and common answers in a simple dashboard. No training, no code.",
  },
  {
    icon: Smartphone,
    title: "People text your number",
    text: "Members and customers message your WhatsApp line the same way they already message everyone else.",
  },
  {
    icon: Zap,
    title: "Relay replies instantly",
    text: "Your assistant answers in seconds, 24/7, using only the information you gave it.",
  },
];

const features = [
  {
    icon: Clock,
    title: "Instant replies, day and night",
    text: "No queues and no missed messages — every question gets a clear answer in seconds, even at 2am.",
  },
  {
    icon: ShieldCheck,
    title: "Trained only on your information",
    text: "Relay answers from what you provide and nothing else, so replies stay accurate and on brand.",
  },
  {
    icon: MessageCircle,
    title: "Lives where everyone already is",
    text: "It works inside WhatsApp — the one app your members and customers open every single day.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* ---- Nav ---- */}
      <nav className={styles.nav}>
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
            <Link href="/login" className={styles.navLink}>
              Sign in
            </Link>
            <Link href="/login" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <header className={styles.hero}>
        <div className={`${styles.container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              <Sparkles size={14} strokeWidth={2.25} />
              Built for organizations across Africa
            </span>
            <h1 className={styles.headline}>
              Every message on WhatsApp, answered <em>instantly</em>.
            </h1>
            <p className={styles.subcopy}>
              Relay turns your organization&apos;s information into an assistant that replies to
              members and customers on WhatsApp — accurate, on brand, and available around the clock.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/login" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
                Get started
                <ArrowRight size={18} strokeWidth={2.25} />
              </Link>
              <a href="#how" className={`${styles.btn} ${styles.btnGhost} ${styles.btnLarge}`}>
                See how it works
              </a>
            </div>
            <p className={styles.heroNote}>
              <MessageCircle size={16} strokeWidth={2.25} />
              Built on WhatsApp · Works for any organization.
            </p>
          </div>

          <div className={styles.heroVisual}>
            <ChatCard />
          </div>
        </div>
      </header>

      {/* ---- Trust strip ---- */}
      <section className={styles.trust} aria-label="Organizations Relay serves">
        <div className={`${styles.container} ${styles.trustInner}`}>
          <span className={styles.trustLabel}>For every kind of organization</span>
          <div className={styles.chips}>
            {chips.map((c) => (
              <span key={c} className={styles.chip}>
                <span aria-hidden />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how" className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.kicker}>How it works</span>
              <h2 className={styles.sectionTitle}>Set up once, then let it answer for you.</h2>
              <p className={styles.sectionSub}>
                From a blank dashboard to answering real questions takes a few minutes — and you
                never write a line of code.
              </p>
            </div>
          </Reveal>

          <div className={styles.steps}>
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 110}>
                <article className={styles.step}>
                  <div className={styles.stepIcon}>
                    <s.icon size={24} strokeWidth={2} />
                  </div>
                  <span className={styles.stepNum}>Step {i + 1}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Feature trio ---- */}
      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.kicker}>Why organizations choose Relay</span>
              <h2 className={styles.sectionTitle}>Always on, always accurate, always on WhatsApp.</h2>
            </div>
          </Reveal>

          <div className={styles.featGrid}>
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 110}>
                <div className={styles.feat}>
                  <div className={styles.featIcon}>
                    <f.icon size={22} strokeWidth={2} />
                  </div>
                  <h3 className={styles.featTitle}>{f.title}</h3>
                  <p className={styles.featText}>{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Dark closing CTA ---- */}
      <section className={styles.ctaBand}>
        <div className={`${styles.container} ${styles.ctaInner}`}>
          <h2 className={styles.ctaTitle}>Ready to stop missing messages?</h2>
          <p className={styles.ctaText}>
            Give your members and customers instant answers on the app they already use. Set up
            your assistant today.
          </p>
          <Link href="/login" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
            Get started
            <ArrowRight size={18} strokeWidth={2.25} />
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <span className={styles.footerBrand}>
            <span className={styles.brandMark}>
              <MessagesSquare size={18} strokeWidth={2.25} />
            </span>
            Relay
          </span>
          <div className={styles.footerLinks}>
            <a href="#how">How it works</a>
            <Link href="/login">Sign in</Link>
            <Link href="/login">Get started</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Relay. The WhatsApp assistant for every kind of organization.
          </div>
        </div>
      </footer>
    </div>
  );
}
