"use client";

import { FormEvent, useState } from "react";

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="m3 7 9 6 9-6"/></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
}

function UserIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>;
}

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(mode === "login" ? "Sign in form submitted." : "Account form submitted.");
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    setMessage("");
    setShowPassword(false);
  }

  return (
    <main className="page-shell">
      <section className="auth-card" aria-label="Authentication">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div className="heading">
          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p>{mode === "login" ? "Sign in to continue to your account." : "Create your account to get started."}</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Authentication mode">
          <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")} role="tab" aria-selected={mode === "login"}>Sign in</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")} role="tab" aria-selected={mode === "register"}>Register</button>
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label className="field">
              <span>Name</span>
              <div className="input-wrap">
                <UserIcon />
                <input name="name" type="text" placeholder="Your name" autoComplete="name" required />
              </div>
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <div className="input-wrap">
              <MailIcon />
              <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            </div>
          </label>

          <label className="field">
            <span>Password</span>
            <div className="input-wrap">
              <LockIcon />
              <input name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required />
              <button type="button" className="show-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {mode === "login" && <div className="form-row"><label className="remember"><input type="checkbox" /> <span>Remember me</span></label><button type="button" className="text-button">Forgot password?</button></div>}

          <button className="submit-button" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button>
        </form>

        {message && <p className="status" role="status">{message}</p>}
        <p className="footer-note">By continuing, you agree to the terms and privacy policy.</p>
      </section>
    </main>
  );
}