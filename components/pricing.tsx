"use client";

import { useMemo, useState } from "react";
import { Shield, CreditCard, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup?: (config: {
        eventHandler: (event: {
          event?: string;
          data?: {
            attributes?: {
              user_email?: string;
            };
          };
        }) => void;
      }) => void;
      Url?: {
        Open: (url: string) => void;
      };
    };
  }
}

interface PricingProps {
  defaultMailbox?: string;
  compact?: boolean;
}

async function activateMailbox(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/paywall/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  });

  const payload = (await response.json()) as { success: boolean; message?: string };

  if (!response.ok) {
    return { success: false, message: payload.message ?? "Unable to verify purchase yet." };
  }

  return { success: true, message: "Purchase verified. Your scanner is unlocked." };
}

export function Pricing({ defaultMailbox = "", compact = false }: PricingProps): React.ReactElement {
  const [mailbox, setMailbox] = useState(defaultMailbox);
  const [status, setStatus] = useState<string>("");
  const [working, setWorking] = useState(false);

  const yearlySavings = useMemo(() => 19 * 12 - 190, []);

  async function startCheckout(): Promise<void> {
    if (!mailbox.includes("@")) {
      setStatus("Enter the Gmail address you want to protect before checkout.");
      return;
    }

    setWorking(true);
    setStatus("Preparing secure checkout overlay...");

    try {
      const response = await fetch(`/api/checkout?mailbox=${encodeURIComponent(mailbox)}`);
      const payload = (await response.json()) as { checkoutUrl?: string; message?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.message ?? "Checkout is not configured yet.");
      }

      if (typeof window !== "undefined") {
        window.createLemonSqueezy?.();
        window.LemonSqueezy?.Setup?.({
          eventHandler: async (event) => {
            if (event.event !== "Checkout.Success") {
              return;
            }

            const paidEmail = event.data?.attributes?.user_email ?? mailbox;
            const activated = await activateMailbox(paidEmail);
            setStatus(activated.message);

            if (activated.success) {
              window.location.href = "/dashboard?paywall=unlocked";
            }
          }
        });

        if (window.LemonSqueezy?.Url?.Open) {
          window.LemonSqueezy.Url.Open(payload.checkoutUrl);
        } else {
          window.location.href = payload.checkoutUrl;
        }
      }

      setStatus("Checkout opened. Complete payment, then return to unlock scanning.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to start checkout right now.");
    } finally {
      setWorking(false);
    }
  }

  async function verifyPayment(): Promise<void> {
    if (!mailbox.includes("@")) {
      setStatus("Enter the paid mailbox email first.");
      return;
    }

    setWorking(true);
    const activated = await activateMailbox(mailbox);
    setStatus(activated.message);

    if (activated.success && typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }

    setWorking(false);
  }

  return (
    <Card className="border-teal-900/40 bg-gradient-to-b from-teal-950/25 to-slate-950/70">
      <CardHeader>
        <Badge className="w-fit" variant="default">
          Security plan
        </Badge>
        <CardTitle className="mt-2 text-2xl">$19/month per mailbox</CardTitle>
        <CardDescription>
          Unlimited scans, full attachment analysis, and instant redaction output. Annual billing saves ${yearlySavings}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center gap-2 font-medium text-slate-100">
              <Shield className="h-4 w-4 text-teal-300" />
              50+ leak signatures
            </div>
            <p className="mt-1 text-slate-400">AWS, Stripe, OpenAI, database URIs, OAuth tokens, SSH keys, and more.</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
            <div className="flex items-center gap-2 font-medium text-slate-100">
              <CreditCard className="h-4 w-4 text-teal-300" />
              Lemon Squeezy checkout
            </div>
            <p className="mt-1 text-slate-400">PCI-compliant overlay checkout with webhook-based entitlement verification.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="mailbox" className="text-sm font-medium text-slate-300">
            Mailbox to protect
          </label>
          <Input
            id="mailbox"
            value={mailbox}
            onChange={(event) => setMailbox(event.target.value)}
            placeholder="founder@yourcompany.com"
            autoComplete="email"
          />
        </div>

        {status ? (
          <p className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">{status}</p>
        ) : null}
      </CardContent>
      <CardFooter className={`gap-3 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
        <Button className="w-full sm:w-auto" disabled={working} onClick={startCheckout}>
          {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Start Secure Checkout
        </Button>
        <Button className="w-full sm:w-auto" variant="outline" disabled={working} onClick={verifyPayment}>
          I already paid, unlock now
        </Button>
      </CardFooter>
    </Card>
  );
}
