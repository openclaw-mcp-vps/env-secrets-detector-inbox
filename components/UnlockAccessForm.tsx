"use client";

import { useState } from "react";

export function UnlockAccessForm() {
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Verifying purchase...");

    const response = await fetch("/api/paywall/unlock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email || undefined,
        sessionId: sessionId || undefined
      })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "Unable to unlock access.");
      return;
    }

    setStatus("success");
    setMessage("Access granted. Redirecting to dashboard...");
    window.location.href = "/dashboard";
  }

  return (
    <form
      onSubmit={handleUnlock}
      className="rounded-2xl border border-[#263144] bg-[#101722] p-6 shadow-[0_0_0_1px_rgba(56,139,253,0.15)]"
    >
      <h3 className="font-[var(--font-space-grotesk)] text-xl font-semibold text-[#f0f6fc]">
        Unlock Your Mailbox Access
      </h3>
      <p className="mt-2 text-sm text-[#8b949e]">
        After checkout, enter the email used for payment. If your Stripe redirect includes a
        `session_id`, paste that too for instant verification.
      </p>

      <div className="mt-5 grid gap-3">
        <label className="text-sm text-[#8b949e]" htmlFor="unlock-email">
          Checkout email
        </label>
        <input
          id="unlock-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none transition focus:border-[#58a6ff]"
          placeholder="founder@company.com"
        />

        <label className="text-sm text-[#8b949e]" htmlFor="unlock-session-id">
          Stripe session ID (optional)
        </label>
        <input
          id="unlock-session-id"
          type="text"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          className="w-full rounded-lg border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none transition focus:border-[#58a6ff]"
          placeholder="cs_test_a1b2c3..."
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#238636] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Verifying..." : "Unlock Dashboard"}
      </button>

      {message ? (
        <p
          className={`mt-3 text-sm ${
            status === "error"
              ? "text-[#ff7b72]"
              : status === "success"
                ? "text-[#3fb950]"
                : "text-[#8b949e]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
