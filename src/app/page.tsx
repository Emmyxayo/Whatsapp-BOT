import Link from "next/link";
import {
  MessagesSquare,
  PencilLine,
  Smartphone,
  Zap,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Inbox,
  Timer,
  MoonStar,
  TrendingUp,
  UserCheck,
  Church,
  GraduationCap,
  Stethoscope,
  Store,
  Check,
  Heart,
} from "lucide-react";
import ChatCard from "@/components/ChatCard";
import DemoChat from "@/components/DemoChat";
import Faq from "@/components/Faq";
import Reveal from "@/components/Reveal";
import styles from "./page.module.css";

/* -------------------------------------------------------------------------- */
/*  Easy-to-edit content constants                                            */
/* -------------------------------------------------------------------------- */

// Monthly pricing. Edit the amounts here — they flow straight into the section.
// These are INBOUND assistant plans (members message in, the assistant replies).
const PRICING = [
  {
    name: "Starter",
    price: "₦10,000",
    period: "/month",
    blurb: "Everything you need to start answering on one WhatsApp number.",
    features: [
      "1 assistant",
      "Info & FAQ management",
      "Human handoff",
      "Basic usage analytics",
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "₦15,000",
    period: "/month",
    blurb: "More reach and deeper insight as your enquiries grow.",
    features: [
      "Everything in Starter",
      "Full analytics",
      "Multilingual replies",
      "Higher usage limits",
    ],
    popular: true,
  },
  {
    name: "Organization",
    price: "₦20,000",
    period: "/month",
    blurb: "For multiple branches, numbers or higher volumes.",
    features: [
      "Everything in Growth",
      "Multiple assistants / numbers",
      "Priority support",
      "Highest usage limits",
    ],
    popular: false,
  },
];

// Where "Get started" and "Talk to us / Book a demo" should point.
// TODO: swap CONTACT_HREF for a WhatsApp click-to-chat, email or Calendly link
// when you have one (e.g. "https://wa.me/2348000000000").
const START_HREF = "/login";
const CONTACT_HREF = "/login";

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

const outcomes = [
  {
    icon: Inbox,
    title: "Never miss an enquiry again",
    text: "Every question that comes in gets a clear answer in seconds — nothing sits unread.",
  },
  {
    icon: Timer,
    title: "Save staff hours every week",
    text: "Stop typing the same replies by hand. Relay handles the repeats so your team doesn't have to.",
  },
  {
    icon: MoonStar,
    title: "Answer members even when your office is closed",
    text: "Evenings, weekends, public holidays — your assistant is awake whenever people reach out.",
  },
  {
    icon: TrendingUp,
    title: "Capture more leads from WhatsApp",
    text: "Reply the moment someone's interested, so enquiries turn into visits, bookings and sales.",
  },
  {
    icon: UserCheck,
    title: "A human can step in anytime",
    text: "When a message needs a person, Relay hands it straight to your team — nothing falls through.",
  },
];

const verticals = [
  {
    icon: Church,
    title: "Churches",
    questions: [
      "What time are your services?",
      "Where are you located?",
      "How do I send a prayer request?",
      "How can I give or tithe?",
    ],
  },
  {
    icon: GraduationCap,
    title: "Schools",
    questions: [
      "How do I apply for admission?",
      "What are the school fees?",
      "When does the new term start?",
      "Can I speak to a teacher?",
    ],
  },
  {
    icon: Stethoscope,
    title: "Clinics",
    questions: [
      "What are your opening hours?",
      "What services do you offer?",
      "Can I book an appointment?",
      "Is the doctor available today?",
    ],
  },
  {
    icon: Store,
    title: "Shops, estates & associations",
    questions: [
      "Is this item in stock?",
      "What are the service charges?",
      "How do I pay my dues?",
      "When is the next meeting?",
    ],
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
            <a href="#pricing" className={`${styles.navLink} ${styles.navLinkHideSm}`}>
              Pricing
            </a>
            <a href="#faq" className={`${styles.navLink} ${styles.navLinkHideSm}`}>
              FAQ
            </a>
            <Link href={START_HREF} className={styles.navLink}>
              Sign in
            </Link>
            <Link href={START_HREF} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
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
            <p className={styles.heroPunch}>No app. No coding. No training. Just WhatsApp.</p>
            <div className={styles.ctaRow}>
              <Link href={START_HREF} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
                Launch your organization&apos;s assistant
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

      {/* ---- Live demo ---- */}
      <section id="demo" className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <Reveal>
            <div className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
              <span className={styles.kicker}>See it in action</span>
              <h2 className={styles.sectionTitle}>A real conversation, answered in seconds.</h2>
              <p className={styles.sectionSub}>
                This is the kind of question your members ask every day — and exactly how Relay
                replies, using only the information you&apos;ve given it.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className={styles.demoWrap}>
              <DemoChat />
              <p className={styles.demoCaption}>A real Relay assistant, answering instantly.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Outcomes ---- */}
      <section className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.kicker}>Why organizations use Relay</span>
              <h2 className={styles.sectionTitle}>Less time on your phone. Nothing missed.</h2>
            </div>
          </Reveal>

          <div className={styles.outcomeGrid}>
            {outcomes.map((o, i) => (
              <Reveal key={o.title} delay={i * 80}>
                <div className={styles.outcome}>
                  <div className={styles.outcomeIcon}>
                    <o.icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className={styles.outcomeTitle}>{o.title}</h3>
                    <p className={styles.outcomeText}>{o.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Who it's for ---- */}
      <section className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.kicker}>Who it&apos;s for</span>
              <h2 className={styles.sectionTitle}>
                Built for how your organization actually works.
              </h2>
              <p className={styles.sectionSub}>
                Whatever you do, your members ask the same things again and again. Relay knows your
                answers — here&apos;s a taste of what it handles.
              </p>
            </div>
          </Reveal>

          <div className={styles.verticalGrid}>
            {verticals.map((v, i) => (
              <Reveal key={v.title} delay={i * 90}>
                <article className={styles.vertical}>
                  <div className={styles.verticalHead}>
                    <div className={styles.verticalIcon}>
                      <v.icon size={22} strokeWidth={2} />
                    </div>
                    <h3 className={styles.verticalTitle}>{v.title}</h3>
                  </div>
                  <ul className={styles.verticalList}>
                    {v.questions.map((q) => (
                      <li key={q} className={styles.verticalItem}>
                        <MessageCircle size={15} strokeWidth={2.25} />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section id="pricing" className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.sectionHead}>
              <span className={styles.kicker}>Pricing</span>
              <h2 className={styles.sectionTitle}>Simple monthly plans for your inbound assistant.</h2>
              <p className={styles.sectionSub}>
                Every plan is for an assistant that answers the people who message you. Pick the
                limits that fit, and change plan whenever you need to.
              </p>
            </div>
          </Reveal>

          <div className={styles.priceGrid}>
            {PRICING.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 90}>
                <article
                  className={`${styles.priceCard} ${tier.popular ? styles.priceCardPopular : ""}`}
                >
                  {tier.popular && <span className={styles.priceBadge}>Most popular</span>}
                  <h3 className={styles.priceName}>{tier.name}</h3>
                  <div className={styles.priceAmount}>
                    <span className={styles.priceValue}>{tier.price}</span>
                    <span className={styles.pricePeriod}>{tier.period}</span>
                  </div>
                  <p className={styles.priceBlurb}>{tier.blurb}</p>
                  <ul className={styles.priceList}>
                    {tier.features.map((f) => (
                      <li key={f} className={styles.priceItem}>
                        <Check size={16} strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={START_HREF}
                    className={`${styles.btn} ${
                      tier.popular ? styles.btnPrimary : styles.btnGhost
                    } ${styles.btnBlock}`}
                  >
                    Get started
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className={styles.priceCustom}>
              <div>
                <h3 className={styles.priceCustomTitle}>Need something custom?</h3>
                <p className={styles.priceCustomText}>
                  Bulk outbound broadcasting and WhatsApp number setup are handled on request and may
                  be billed separately. Tell us what you need and we&apos;ll put it together.
                </p>
              </div>
              <Link
                href={CONTACT_HREF}
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}
              >
                Book a demo / Talk to us
                <ArrowRight size={18} strokeWidth={2.25} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className={`${styles.section} ${styles.sectionSoft}`}>
        <div className={styles.container}>
          <Reveal>
            <div className={`${styles.sectionHead} ${styles.sectionHeadCenter}`}>
              <span className={styles.kicker}>FAQ</span>
              <h2 className={styles.sectionTitle}>Questions, answered honestly.</h2>
            </div>
          </Reveal>
          <Reveal>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* ---- Why we built Relay ---- */}
      <section id="story" className={styles.section}>
        <div className={styles.container}>
          <Reveal>
            <div className={styles.story}>
              <span className={styles.storyMark}>
                <Heart size={20} strokeWidth={2.25} />
              </span>
              <span className={styles.kicker}>Why we built Relay</span>
              <h2 className={styles.sectionTitle}>The same questions, all day, every day.</h2>
              <p className={styles.storyText}>
                Across Lagos and beyond, organizations — especially churches, schools and clinics —
                spend hours every week answering the same questions on WhatsApp. What time are
                services? How much are the fees? Are you open today?
              </p>
              <p className={styles.storyText}>
                We built Relay so those answers arrive instantly, around the clock, without anyone
                having to stop what they&apos;re doing. It gives every organization a dependable
                assistant on the app their people already use — and frees their team for the work
                that actually needs them.
              </p>
              <p className={styles.storySign}>
                Relay is a product of Xayion Tech, based in Lagos, Nigeria — founded by Pastor
                Oyebade Olumide Daniel and built by Oyebade Emmanuel.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Dark closing CTA ---- */}
      <section className={styles.ctaBand}>
        <div className={`${styles.container} ${styles.ctaInner}`}>
          <h2 className={styles.ctaTitle}>Launch your organization&apos;s assistant.</h2>
          <p className={styles.ctaText}>
            Give your members and customers instant answers on the app they already use. Most
            organizations are live the same day. No app. No coding. No training. Just WhatsApp.
          </p>
          <div className={styles.ctaRow}>
            <Link href={START_HREF} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLarge}`}>
              Launch your organization&apos;s assistant
              <ArrowRight size={18} strokeWidth={2.25} />
            </Link>
            <a href="#how" className={`${styles.btn} ${styles.btnDark} ${styles.btnLarge}`}>
              See how it works
            </a>
          </div>
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
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link href={START_HREF}>Sign in</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Relay — a product of Xayion Tech, Lagos, Nigeria. The
            WhatsApp assistant for every kind of organization.
          </div>
        </div>
      </footer>
    </div>
  );
}
