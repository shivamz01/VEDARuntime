import { randomUUID } from 'node:crypto';
import {
  issueLicenseKey,
  verifyLicenseKey,
} from '../packages/pro/dist/index.js';

function getArg(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function requireSecret() {
  const secret = process.env.VEDA_LICENSE_SECRET;
  if (!secret) {
    throw new Error('VEDA_LICENSE_SECRET_REQUIRED');
  }
  return secret;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function printUsage() {
  console.log([
    'Usage:',
    '  node scripts/license.mjs issue --customer <provider_customer_id> [--days 30] [--slot 1]',
    '  node scripts/license.mjs verify <license_key>',
    '',
    'Requires VEDA_LICENSE_SECRET in the environment.'
  ].join('\n'));
}

const command = process.argv[2];

try {
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  if (command === 'issue') {
    const secret = requireSecret();
    const customerId = getArg('--customer');
    if (!customerId) throw new Error('CUSTOMER_REQUIRED');

    const days = Number.parseInt(getArg('--days', '30'), 10);
    if (!Number.isInteger(days) || days <= 0) throw new Error('DAYS_INVALID');

    const slotArg = getArg('--slot');
    const foundingSlot = slotArg ? Number.parseInt(slotArg, 10) : undefined;
    if (slotArg && (!Number.isInteger(foundingSlot) || foundingSlot < 1 || foundingSlot > 2000)) {
      throw new Error('FOUNDING_SLOT_INVALID');
    }

    const issuedAt = new Date();
    const expiresAt = addDays(issuedAt, days);
    const licenseKey = issueLicenseKey({
      license_id: `lic_${randomUUID()}`,
      customer_id: customerId,
      plan: 'pro',
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      ...(foundingSlot ? { founding_slot: foundingSlot } : {}),
    }, secret);

    console.log(JSON.stringify({
      status: 'issued',
      plan: 'pro',
      customerId,
      foundingSlot: foundingSlot ?? null,
      expiresAt: expiresAt.toISOString(),
      licenseLast4: licenseKey.slice(-4),
      licenseKey,
    }, null, 2));
    process.exit(0);
  }

  if (command === 'verify') {
    const secret = requireSecret();
    const licenseKey = process.argv[3];
    const result = verifyLicenseKey(licenseKey, secret);

    console.log(JSON.stringify({
      valid: result.valid,
      errors: result.errors,
      edition: result.edition,
      features: result.features,
      licenseId: result.claims?.license_id ?? null,
      customerId: result.claims?.customer_id ?? null,
      expiresAt: result.claims?.expires_at ?? null,
    }, null, 2));
    process.exit(result.valid ? 0 : 1);
  }

  throw new Error(`UNKNOWN_COMMAND: ${command}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
