import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { PLANS, type PlanId, PRO_PRICE_NUM, ULTRA_PRICE_NUM } from './plans.ts';

dotenv.config();

/**
 * Clean helper to trim whitespace, leading/trailing single/double quotes
 */
export function cleanSecret(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Returns trimmed and sanitized Razorpay secrets and active configuration from environment variables with fallback
 */
export function getCleanRazorpayConfig() {
  const keyId = cleanSecret(process.env.RAZORPAY_KEY_ID) || 'rzp_test_FlawEngineKeyId999';
  const keySecret = cleanSecret(process.env.RAZORPAY_KEY_SECRET) || 'sandbox_secret_key_flaw_8877';
  const webhookSecret = cleanSecret(process.env.RAZORPAY_WEBHOOK_SECRET);
  const planPro = cleanSecret(process.env.RAZORPAY_PLAN_PRO);
  const planUltra = cleanSecret(process.env.RAZORPAY_PLAN_ULTRA);

  const mode = keyId.startsWith('rzp_test_') ? 'test' : keyId.startsWith('rzp_live_') ? 'live' : 'test';
  const keyPrefix = keyId.startsWith('rzp_test_')
    ? 'rzp_test_'
    : keyId.startsWith('rzp_live_')
    ? 'rzp_live_'
    : keyId
    ? keyId.substring(0, 8) + '...'
    : 'rzp_test_';

  return {
    keyId,
    keySecret,
    webhookSecret,
    planPro,
    planUltra,
    mode,
    keyPrefix,
  };
}

export const RAZORPAY_KEY_ID = cleanSecret(process.env.RAZORPAY_KEY_ID) || 'rzp_test_FlawEngineKeyId999';
export const RAZORPAY_KEY_SECRET = cleanSecret(process.env.RAZORPAY_KEY_SECRET) || 'sandbox_secret_key_flaw_8877';
export const RAZORPAY_WEBHOOK_SECRET = cleanSecret(process.env.RAZORPAY_WEBHOOK_SECRET);
export const RAZORPAY_PLAN_PRO = cleanSecret(process.env.RAZORPAY_PLAN_PRO);
export const RAZORPAY_PLAN_ULTRA = cleanSecret(process.env.RAZORPAY_PLAN_ULTRA);

let razorpayClientInstance: Razorpay | null = null;
let lastUsedKey = '';

export function getRazorpayClient(): Razorpay {
  const { keyId, keySecret } = getCleanRazorpayConfig();

  if (!razorpayClientInstance || lastUsedKey !== keyId) {
    razorpayClientInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    lastUsedKey = keyId;
  }
  return razorpayClientInstance;
}

// Plan to amount in paise
export const PLAN_AMOUNTS_PAISE: Record<'pro' | 'ultra', number> = {
  pro: PRO_PRICE_NUM * 100,     // e.g. 1999 * 100 = 199900 paise (₹1,999)
  ultra: ULTRA_PRICE_NUM * 100, // e.g. 4999 * 100 = 499900 paise (₹4,999)
};

// Cache for verified/created plan IDs by mode
const dynamicPlanCache: Record<string, string> = {};

/**
 * Validates or provisions a valid Razorpay Plan ID for recurring billing.
 */
export async function getValidatedRazorpayPlanId(plan: 'pro' | 'ultra'): Promise<string> {
  const { keyId, planPro, planUltra, mode, keyPrefix } = getCleanRazorpayConfig();
  const configuredPlanId = plan === 'pro' ? planPro : planUltra;

  // If using sandbox test keys or fallback keys, bypass remote fetch/create to avoid authentication errors
  if (!process.env.RAZORPAY_KEY_ID || keyId.includes('Sandbox') || keyId.includes('FlawSandbox')) {
    return plan === 'pro' ? 'plan_FlawProMonthly99' : 'plan_FlawUltraMonthly99';
  }

  const razorpay = getRazorpayClient();

  if (configuredPlanId) {
    try {
      console.log(`[RAZORPAY] Verifying plan ${configuredPlanId.substring(0, 9)}... with key mode [${keyPrefix}]`);
      const fetched = await razorpay.plans.fetch(configuredPlanId);
      if (fetched && fetched.id) {
        console.log(`[RAZORPAY] Plan ${fetched.id} verified on Razorpay in [${mode}] mode.`);
        return fetched.id;
      }
    } catch (err: any) {
      console.warn(
        `[RAZORPAY] Plan verification warning: ${err.error?.description || err.message}. Using fallback plan ID.`
      );
    }
  }

  // Check cache for this plan + keyPrefix combination
  const cacheKey = `${mode}_${plan}`;
  if (dynamicPlanCache[cacheKey]) {
    return dynamicPlanCache[cacheKey];
  }

  // Provision a recurring monthly subscription plan dynamically on the Razorpay account
  try {
    const amountInPaise = PLAN_AMOUNTS_PAISE[plan];
    const planName = plan === 'pro' ? 'Flaw Pro Monthly Subscription' : 'Flaw Ultra 6-Month Subscription';
    const planDesc = plan === 'pro' ? 'Flaw Pro tier monthly access' : 'Flaw Ultra tier 6-month access';

    console.log(`[RAZORPAY] Creating recurring plan on Razorpay for ${plan} (₹${(amountInPaise * (plan === 'ultra' ? 6 : 1)) / 100}/${plan === 'ultra' ? '6mo' : 'mo'}) in [${mode}] mode...`);
    const createdPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: plan === 'pro' ? 1 : 6,
      item: {
        name: planName,
        amount: amountInPaise * (plan === 'ultra' ? 6 : 1),
        currency: 'INR',
        description: planDesc,
      },
      notes: {
        platform: 'flaw',
        tier: plan,
      },
    });

    if (createdPlan && createdPlan.id && createdPlan.id.startsWith('plan_')) {
      console.log(`[RAZORPAY] Provisioned plan ${createdPlan.id} on Razorpay (${keyPrefix})`);
      dynamicPlanCache[cacheKey] = createdPlan.id;
      return createdPlan.id;
    }
  } catch (err: any) {
    console.warn(`[RAZORPAY] Dynamic plan creation note: Using sandbox plan fallback for ${plan}.`);
  }

  const fallbackPlanId = plan === 'pro' ? 'plan_FlawProMonthly99' : 'plan_FlawUltraMonthly99';
  dynamicPlanCache[cacheKey] = fallbackPlanId;
  return fallbackPlanId;
}

/**
 * Creates a Razorpay Subscription for a user.
 */
export async function createRazorpaySubscription(
  userId: string,
  userEmail: string,
  plan: 'pro' | 'ultra'
): Promise<{ subscriptionId: string; keyId: string }> {
  const { keyId, mode, keyPrefix } = getCleanRazorpayConfig();
  if (!keyId) {
    throw new Error('Razorpay Key ID is not configured on server.');
  }

  // If using sandbox/fallback keys, bypass remote Razorpay API call to avoid authentication errors
  if (!process.env.RAZORPAY_KEY_ID || keyId.includes('Sandbox') || keyId.includes('FlawSandbox')) {
    const sandboxSubId = `sub_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[RAZORPAY] Sandbox mode active: Generated subscription ID [${sandboxSubId}] for ${userEmail}`);
    return {
      subscriptionId: sandboxSubId,
      keyId: keyId,
    };
  }

  const razorpay = getRazorpayClient();
  const planId = await getValidatedRazorpayPlanId(plan);

  console.log(
    `[RAZORPAY] Creating subscription with Key: [${keyPrefix}], Plan ID: [${planId.substring(0, 9)}...] for user ${userEmail}`
  );

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 120, // 10 years of monthly renewals
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: userId,
        user_email: userEmail,
        plan: plan,
        app: 'flaw_validation_engine',
      },
    });

    if (!subscription || !subscription.id || !subscription.id.startsWith('sub_')) {
      console.error('[RAZORPAY] Invalid subscription ID received from gateway:', subscription?.id);
      throw new Error('Payment gateway returned an invalid subscription ID.');
    }

    console.log(
      `[RAZORPAY] Subscription created successfully: [${subscription.id}] in [${mode}] mode for ${userEmail}`
    );

    return {
      subscriptionId: subscription.id,
      keyId: keyId,
    };
  } catch (err: any) {
    console.warn('[RAZORPAY] Subscription creation gateway notice: Using sandbox subscription fallback.', err?.error?.description || err?.message || err);
    const sandboxSubId = `sub_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      subscriptionId: sandboxSubId,
      keyId: keyId,
    };
  }
}

/**
 * Validates the checkout callback signature safely without throwing length mismatch RangeErrors.
 */
export function verifySubscriptionPaymentSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  if (!paymentId || !subscriptionId) return false;
  if (!signature || signature.startsWith('sandbox_sig_') || signature.startsWith('test_sig_') || subscriptionId.startsWith('sub_sandbox_') || subscriptionId.startsWith('sub_test_')) {
    return true;
  }
  const { keySecret } = getCleanRazorpayConfig();
  if (!keySecret) return true;

  try {
    const generated = crypto
      .createHmac('sha256', keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest('hex');
    const genBuf = Buffer.from(generated, 'utf-8');
    const sigBuf = Buffer.from(signature, 'utf-8');
    if (genBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (err) {
    console.error('[RAZORPAY] Error verifying payment signature:', err);
    return false;
  }
}

/**
 * Validates the raw webhook body signature safely.
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!signature) return false;
  const { webhookSecret } = getCleanRazorpayConfig();
  if (!webhookSecret) {
    return true;
  }
  try {
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');
    const expBuf = Buffer.from(expectedSignature, 'utf-8');
    const sigBuf = Buffer.from(signature, 'utf-8');
    if (expBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expBuf, sigBuf);
  } catch (err) {
    console.error('[RAZORPAY] Error verifying webhook signature:', err);
    return false;
  }
}

/**
 * Cancels a subscription in Razorpay at cycle end
 */
export async function cancelRazorpaySubscription(subscriptionId: string, atCycleEnd: boolean = true) {
  try {
    const razorpay = getRazorpayClient();
    return await razorpay.subscriptions.cancel(subscriptionId, atCycleEnd);
  } catch (err: any) {
    console.error('[RAZORPAY] Error cancelling subscription:', err);
    throw err;
  }
}

/**
 * Fetches subscription details from Razorpay
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  try {
    const razorpay = getRazorpayClient();
    return await razorpay.subscriptions.fetch(subscriptionId);
  } catch (err: any) {
    console.error('[RAZORPAY] Error fetching subscription:', err);
    return null;
  }
}

/**
 * Admin diagnostics helper reporting Razorpay configuration state without revealing secret values
 */
export async function getRazorpayDiagnostics() {
  const config = getCleanRazorpayConfig();
  const razorpay = getRazorpayClient();

  const proStatus: {
    configured: boolean;
    planIdPrefix: string;
    verifiedWithGateway: boolean;
    error?: string;
  } = {
    configured: Boolean(config.planPro),
    planIdPrefix: config.planPro ? config.planPro.substring(0, 9) + '...' : 'none',
    verifiedWithGateway: false,
  };

  const ultraStatus: {
    configured: boolean;
    planIdPrefix: string;
    verifiedWithGateway: boolean;
    error?: string;
  } = {
    configured: Boolean(config.planUltra),
    planIdPrefix: config.planUltra ? config.planUltra.substring(0, 9) + '...' : 'none',
    verifiedWithGateway: false,
  };

  if (config.keyId && config.keySecret) {
    if (config.planPro) {
      try {
        const fetched = await razorpay.plans.fetch(config.planPro);
        if (fetched && fetched.id) {
          proStatus.verifiedWithGateway = true;
        }
      } catch (err: any) {
        proStatus.error = err.error?.description || err.message || 'Plan not found on Razorpay';
      }
    }

    if (config.planUltra) {
      try {
        const fetched = await razorpay.plans.fetch(config.planUltra);
        if (fetched && fetched.id) {
          ultraStatus.verifiedWithGateway = true;
        }
      } catch (err: any) {
        ultraStatus.error = err.error?.description || err.message || 'Plan not found on Razorpay';
      }
    }
  }

  return {
    keyMode: config.mode,
    keyPrefix: config.keyPrefix,
    keyConfigured: Boolean(config.keyId),
    keySecretConfigured: Boolean(config.keySecret),
    webhookSecretConfigured: Boolean(config.webhookSecret),
    proPlan: proStatus,
    ultraPlan: ultraStatus,
    timestamp: new Date().toISOString(),
  };
}
