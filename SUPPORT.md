# Support

## First Step

Ask the user to run:

```bash
npm run support:collect
```

This creates a redacted JSON artifact under `logs/`. It includes:

- OS, Node.js, npm, and git commit information
- package version and scripts
- whether required environment keys are present
- latest pipeline artifact summaries

It does **not** include secret environment values and does **not** collect customer data.

## Free Support

Free users get self-serve support:

1. Run `npm run pipeline:proof`.
2. Run `npm run support:collect`.
3. Check `TROUBLESHOOTING.md`.
4. Open a GitHub issue with the exact command, error output, Node.js version, and support artifact.

## Pro Support

Pro users get automated triage plus escalation to the maintainer:

1. Run `npm run pipeline:audit`.
2. Run `npm run support:collect`.
3. Send the support artifact and exact failing command through the paid support channel.

For a $20/month launch plan, do not promise 24/7 response, custom implementation work, or emergency production guarantees unless a separate written agreement exists.

## What Not To Send

Do not send:

- `.env` files
- API keys
- Supabase service keys
- private customer data
- private source code unrelated to the failing VEDA Runtime command

