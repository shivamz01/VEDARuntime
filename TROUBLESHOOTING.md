# Troubleshooting

## Check Node.js First

VEDA Runtime requires Node.js 20 or newer:

```bash
node --version
```

If the version is below 20, install a newer Node.js release and run `npm install` again.

## Install Fails

Run:

```bash
npm install
```

If it fails, capture the exact error text. Do not delete `package-lock.json` unless a maintainer asks for that specific change.

## Build Fails

Run:

```bash
npm run build
```

If build fails, run:

```bash
npm run support:collect
```

Then send the support artifact and the exact build error.

## Pipeline Fails

For Free users:

```bash
npm run pipeline:proof
```

For Pro users:

```bash
npm run pipeline:audit
```

Pipeline reports are written under `logs/`. The newest `pipeline-*.json` file is the source of truth for which gate failed.

## Paid Supabase Setup Fails

Confirm these keys exist in your local environment:

```bash
SUPABASE_URL
SUPABASE_SERVICE_KEY
VEDA_HMAC_KEY
```

Do not paste the values into a public issue. The support bundle reports only whether each key is present.

## Before Asking For Help

Run:

```bash
npm run support:collect
```

Send the generated `logs/support-bundle-*.json` file together with the exact command that failed.

