import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Paystack calls this when a payment event happens.
// Set the URL in dashboard.paystack.com -> Settings -> Webhooks.
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Verify the request really came from Paystack.
  const signature = req.headers.get("x-paystack-signature");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(raw)
    .digest("hex");

  if (hash !== signature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(raw);

  // On a successful charge / subscription, mark the organization active.
  // You decide how to map Paystack customer -> org (e.g. metadata.organization_id).
  if (event.event === "charge.success" || event.event === "subscription.create") {
    const organizationId = event.data?.metadata?.organization_id;
    const customerCode = event.data?.customer?.customer_code;
    if (organizationId) {
      await supabase
        .from("organizations")
        .update({ subscription_status: "active", paystack_customer_code: customerCode })
        .eq("id", organizationId);
    }
  }

  return NextResponse.json({ ok: true });
}
