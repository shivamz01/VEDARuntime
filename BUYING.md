# Buying VEDA Runtime

VEDA Runtime has two launch tiers:

| Tier | Price | Who it is for |
|---|---:|---|
| Free | $0/month | Individual developers testing the local proof chain |
| Pro | $20/month | Builders and small teams that need paid adapters, audit bundles, and support triage |

## Founding Offer

The founding offer is **35% off for the first 3 months** for the **first 2000 paid users**.

That makes Pro:

- **$13/month** for months 1-3
- **$20/month** from month 4 onward

This discount is for paid users only. Free users do not consume a founding slot.

## Payment Flow

Use one payment provider as the source of truth for money. At launch, a simple hosted checkout is enough:

1. Create a monthly Pro subscription product at **$20/month**.
2. Create the founding discount as **35% off for the first 3 months**.
3. Cap the discount to the **first 2000 paid users** if the provider supports redemption limits.
4. If the provider does not support a 2000-user cap, track slots manually with `docs/templates/founding_customer_tracker.csv`.
5. After payment, send the customer the Pro setup instructions and support link.

Do not store live customer data in this public repository. Keep the real tracker in a private spreadsheet, private database, or the payment provider console.

## Customer Tracking

The Excel-compatible template is:

```bash
docs/templates/founding_customer_tracker.csv
```

Make a private copy and fill one row per paid customer. The `founding_slot` column should run from `1` to `2000`. When slot `2000` is used, disable the founding discount in the payment provider.

## What Customers Receive

Free users get the local runtime, proof pipeline, local ledger, rollback engine, and sandbox policy.

Pro users get the paid package boundary, Supabase adapters, paid audit proof demo, governance profiles, exportable proof bundles, and automated support bundle collection.

Enterprise is not the launch product. Do not sell enterprise promises until the enterprise deployment, legal, security review, and support process are real.
