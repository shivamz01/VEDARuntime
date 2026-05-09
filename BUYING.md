# Buying VEDA Runtime

VEDA Runtime has two launch tiers:

| Tier | Price | Who it is for |
|---|---|---|
| Free | $0 / month | Individual developers testing the local proof chain |
| Pro | $20 / month | Builders and small teams that need Supabase persistence, audit bundles, and support triage |

---

## Founding Offer

The founding offer is **35% off for the first 3 months** for the **first 2,000 paid users**.

That makes Pro:

- **$13 / month** for months 1–3
- **$20 / month** from month 4 onward

This discount applies to paid users only. Free users do not consume a founding slot.

---

## Payment Flow

1. Create a monthly Pro subscription at **$20 / month** in your payment provider.
2. Create the founding discount as **35% off for the first 3 months**.
3. Cap the discount to the **first 2,000 paid users** if your provider supports redemption limits.
4. If your provider does not support a redemption cap, track slots manually using `docs/templates/founding_customer_tracker.csv`.
5. After payment is confirmed, issue a Pro license key and send the customer the Pro setup instructions and support link.

**Do not store live customer data in this public repository.** Keep your real customer tracker in a private spreadsheet, private database, or inside your payment provider's console.

---

## Customer Tracking

An Excel-compatible template is provided at:

```
docs/templates/founding_customer_tracker.csv
```

Make a private copy and fill one row per paid customer. The `founding_slot` column should run from `1` to `2000`. When slot `2000` is used, disable the founding discount in your payment provider.

Store only the `licenseLast4`, provider customer ID, and subscription ID in your tracker. Never commit issued license keys or payment data to Git.

---

## What Customers Receive

**Free Edition:**  
Local runtime, proof pipeline, local HMAC-chained audit ledger, Rollback Engine, Execution Sandbox, Context Governor.

**Pro Edition:**  
Everything in Free, plus: Supabase persistence adapters (audit ledger, nonce registry, pipeline log), exportable audit proof bundles, advanced governance profile packs, API status telemetry, and support triage.

**Enterprise:**  
Not the launch product. Do not make enterprise promises until enterprise deployment, legal review, and dedicated support processes are real.

---

## Support

See [`SUPPORT.md`](./SUPPORT.md) for the full support workflow.
