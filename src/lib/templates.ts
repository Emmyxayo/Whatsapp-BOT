// Pre-built starter templates per vertical. Picking one pre-fills the org's
// knowledge fields with a sensible structure (with [bracketed] placeholders the
// admin replaces) so a new organization is useful fast instead of staring at a
// blank form. Purely starter content — admins edit everything afterwards.

// The structured knowledge an organization keeps. Mirrors the org_updates
// columns the assistant reasons over.
export type OrgKnowledge = {
  about: string;
  hours: string;
  location: string;
  announcements: string;
  contact: string;
  giving: string;
  events: string;
};

export type OrgTemplate = {
  id: "church" | "school" | "clinic" | "shop";
  label: string;
  // One-line hint shown under the template name.
  blurb: string;
  fields: OrgKnowledge;
};

export const ORG_TEMPLATES: OrgTemplate[] = [
  {
    id: "church",
    label: "Church",
    blurb: "Services, giving, events",
    fields: {
      about:
        "We're a welcoming church family in [area]. Everyone is welcome — come as you are.",
      hours:
        "Sunday services: [9:00am] & [11:00am]\nMidweek service: [Wednesday 6:00pm]\nPrayer meeting: [Friday 6:00pm]",
      location:
        "[123 Church Street, City]. Parking is available [behind the building]. Look out for [landmark].",
      announcements:
        "This week: [share what's happening — guest speaker, special service, notices].",
      contact:
        "Phone: [+234 ...]\nEmail: [hello@church.org]\nPastor [Name] / Church office",
      giving:
        "You can give via bank transfer:\nBank: [Bank name]\nAccount name: [Church name]\nAccount number: [0000000000]\nOr give in person during Sunday service.",
      events:
        "Upcoming:\n- [Date] — [Event name]\n- [Date] — [Event name]",
    },
  },
  {
    id: "school",
    label: "School",
    blurb: "Term dates, fees, admissions",
    fields: {
      about:
        "[School name] is a [primary/secondary] school in [area] offering [brief description].",
      hours:
        "School hours: [Mon–Fri, 8:00am–3:00pm]\nOffice hours: [Mon–Fri, 8:00am–4:00pm]\nCurrent term: [start date] – [end date]",
      location:
        "[School address, City]. Main gate is on [street]. Visitor parking [location].",
      announcements:
        "This week: [exams, holidays, PTA meeting, notices for parents].",
      contact:
        "Phone: [+234 ...]\nEmail: [admin@school.edu]\nAdmissions: [contact]",
      giving:
        "School fees for [term/year]:\n- [Class/level]: [amount]\nPayment: bank transfer to [Bank, Account name, Account number]. Keep your teller/receipt.",
      events:
        "Upcoming:\n- [Date] — [Open day / Resumption / Sports day]\n- [Date] — [Event]",
    },
  },
  {
    id: "clinic",
    label: "Clinic",
    blurb: "Hours, services, payments",
    fields: {
      about:
        "[Clinic name] provides [general/specialist] healthcare in [area]. [Brief description of services].",
      hours:
        "Consultation hours: [Mon–Fri, 9:00am–5:00pm]\nSaturday: [9:00am–1:00pm]\nEmergencies: [24/7 / call ahead]",
      location:
        "[Clinic address, City]. We're [near landmark]. Parking [details].",
      announcements:
        "This week: [vaccination drive, doctor availability, health notices].",
      contact:
        "Phone: [+234 ...]\nWhatsApp/Emergency line: [+234 ...]\nEmail: [info@clinic.com]",
      giving:
        "Consultation fee: [amount]\nWe accept: [cash, card, transfer].\nInsurance/HMO: [list accepted plans].",
      events:
        "Upcoming:\n- [Date] — [Free check-up / Health talk]\n- [Date] — [Event]",
    },
  },
  {
    id: "shop",
    label: "Shop",
    blurb: "Opening hours, products, payment",
    fields: {
      about:
        "[Shop name] sells [products] in [area]. [What makes you stand out — quality, prices, delivery].",
      hours:
        "Opening hours:\nMon–Sat: [9:00am–7:00pm]\nSunday: [closed / 12:00pm–5:00pm]",
      location:
        "[Shop address, City]. We're [near landmark]. [Delivery available within ...].",
      announcements:
        "This week: [new stock, promotions, discounts, restocks].",
      contact:
        "Phone/WhatsApp: [+234 ...]\nInstagram: [@handle]\nEmail: [shop@email.com]",
      giving:
        "Payment methods: [cash, card, bank transfer].\nBank: [Bank name]\nAccount name: [Shop name]\nAccount number: [0000000000]\nDelivery fee: [amount / depends on location].",
      events:
        "Upcoming:\n- [Date] — [Sale / Pop-up / New collection]",
    },
  },
];
