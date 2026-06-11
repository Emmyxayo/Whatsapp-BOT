"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Sparkles, AlertCircle } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Wrong username or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.wrap}>
      {/* Left panel — hidden on mobile */}
      <aside className={styles.left}>
        <span className={styles.brand}>
          <span className={styles.brandMark}>
            <MessagesSquare size={18} strokeWidth={2.25} />
          </span>
          Relay
        </span>

        <div className={styles.leftBody}>
          <span className={styles.leftEyebrow}>
            <Sparkles size={14} strokeWidth={2.25} />
            Your organization&apos;s assistant
          </span>
          <h2 className={styles.leftHeadline}>Welcome back.</h2>
          <p className={styles.leftSub}>
            Sign in to manage your organization&apos;s assistant — update your information and keep
            every reply on WhatsApp accurate.
          </p>
        </div>

        <div className={styles.motif} aria-hidden>
          <div className={`${styles.bubble} ${styles.bubbleIn}`}>
            Hi 👋 what time do you open today?
          </div>
          <div className={`${styles.bubble} ${styles.bubbleOut}`}>
            We&apos;re open 9am–5pm today.
          </div>
        </div>
      </aside>

      {/* Right panel — sign-in card */}
      <section className={styles.right}>
        <div className={styles.card}>
          <span className={styles.logoMobile}>
            <span className={styles.brandMark}>
              <MessagesSquare size={18} strokeWidth={2.25} />
            </span>
            Relay
          </span>

          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.lead}>Enter your username and password to continue.</p>

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              placeholder="your-organization"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className={styles.error}>
              <AlertCircle size={16} strokeWidth={2.25} />
              {error}
            </p>
          )}

          <button onClick={handleLogin} disabled={loading} className={styles.btn}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
