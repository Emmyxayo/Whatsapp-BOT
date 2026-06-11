import { Space_Grotesk, Inter } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Relay — answer members and customers on WhatsApp, automatically",
  description:
    "Relay lets any organization answer members and customers automatically on WhatsApp — instant replies, day and night, trained only on your information.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body style={{ margin: 0, fontFamily: "var(--font-body), system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
