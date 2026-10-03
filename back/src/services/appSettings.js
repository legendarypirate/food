import { Setting } from '../models/index.js';

const PAYMENTS_ENABLED_KEY = 'paymentsEnabled';

export async function isPaymentsEnabled() {
  const row = await Setting.findByPk(PAYMENTS_ENABLED_KEY);
  if (!row) return true;
  return row.value !== 'false';
}

export async function getPaymentSettings() {
  const enabled = await isPaymentsEnabled();
  return { paymentsEnabled: enabled };
}

export async function setPaymentsEnabled(enabled) {
  await Setting.upsert({
    key: PAYMENTS_ENABLED_KEY,
    value: enabled ? 'true' : 'false',
  });
  return { paymentsEnabled: Boolean(enabled) };
}
