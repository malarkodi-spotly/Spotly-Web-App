/**
 * Spotly Purchase Service
 * Handles Google Play Billing subscriptions via @capgo/native-purchases
 * Requires: @capgo/native-purchases plugin + BILLING permission in AndroidManifest.xml
 */

import { Capacitor } from '@capacitor/core';

// Dynamically import so the app does not crash on web/browser
let NativePurchases: any = null;
let PURCHASE_TYPE: any = null;

async function loadPlugin(): Promise<boolean> {
  if (NativePurchases) return true;
  if (!Capacitor.isNativePlatform()) {
    console.warn('[PurchaseService] Not on a native platform. Billing unavailable.');
    return false;
  }
  try {
    const mod = await import('@capgo/native-purchases');
    NativePurchases = mod.NativePurchases;
    PURCHASE_TYPE = mod.PURCHASE_TYPE;
    return true;
  } catch (e) {
    console.error('[PurchaseService] Failed to load @capgo/native-purchases:', e);
    return false;
  }
}

// ── Product IDs — must match Google Play Console exactly ─────────────────────
export const SPOTLY_PRODUCTS = {
  PREMIUM_MONTHLY: 'spotly_premium',
  PREMIUM_YEARLY: 'spotly_premium_yearly',
} as const;

// ── Base Plan IDs — must match Play Console base plan IDs ────────────────────
export const SPOTLY_PLANS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type SpotlyProduct = (typeof SPOTLY_PRODUCTS)[keyof typeof SPOTLY_PRODUCTS];
export type SpotlyPlan   = (typeof SPOTLY_PLANS)[keyof typeof SPOTLY_PLANS];

export interface SpotlySubscriptionProduct {
  productIdentifier: string;
  localizedTitle: string;
  localizedDescription: string;
  price: number;
  localizedPriceString: string;
  currencyCode: string;
}

export interface PurchaseResult {
  success: boolean;
  productIdentifier?: string;
  transactionId?: string;
  error?: string;
}

export interface BillingStatus {
  isSupported: boolean;
  platform: string;
}

// ── Check if Google Play Billing is available on this device ─────────────────
export async function checkBillingSupported(): Promise<BillingStatus> {
  const platform = Capacitor.getPlatform();
  const loaded = await loadPlugin();
  if (!loaded) return { isSupported: false, platform };

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    console.log('[PurchaseService] Billing supported:', isBillingSupported);
    return { isSupported: isBillingSupported, platform };
  } catch (e: any) {
    console.error('[PurchaseService] isBillingSupported error:', e);
    return { isSupported: false, platform };
  }
}

// ── Fetch subscription products from Play Store ───────────────────────────────
export async function getSubscriptionProducts(
  productIds: string[] = Object.values(SPOTLY_PRODUCTS),
): Promise<SpotlySubscriptionProduct[]> {
  const loaded = await loadPlugin();
  if (!loaded) return [];

  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: productIds,
      productType: PURCHASE_TYPE.SUBS,
    });
    console.log('[PurchaseService] Products fetched:', products);
    return products ?? [];
  } catch (e: any) {
    console.error('[PurchaseService] getProducts error:', e);
    return [];
  }
}

// ── Start a subscription purchase ────────────────────────────────────────────
export async function purchaseSubscription(
  productIdentifier: SpotlyProduct,
  planIdentifier: SpotlyPlan,
): Promise<PurchaseResult> {
  const loaded = await loadPlugin();
  if (!loaded) return { success: false, error: 'Billing not available on this platform' };

  try {
    console.log('[PurchaseService] Purchasing:', productIdentifier, '| plan:', planIdentifier);
    const result = await NativePurchases.purchaseProduct({
      productIdentifier,
      planIdentifier,
      productType: PURCHASE_TYPE.SUBS,
    });
    return {
      success: true,
      productIdentifier: result?.productIdentifier,
      transactionId: result?.transactionId,
    };
  } catch (e: any) {
    console.error('[PurchaseService] purchaseProduct error:', e);
    const cancelled =
      e?.code === 'PURCHASE_CANCELLED' || e?.message?.toLowerCase().includes('cancel');
    return { success: false, error: cancelled ? 'Purchase cancelled by user' : (e?.message ?? 'Unknown purchase error') };
  }
}

// ── Restore previous purchases (required by Play Store policy) ───────────────
export async function restorePurchases(): Promise<PurchaseResult> {
  const loaded = await loadPlugin();
  if (!loaded) return { success: false, error: 'Billing not available on this platform' };

  try {
    const result = await NativePurchases.restorePurchases();
    console.log('[PurchaseService] Restored:', result);
    return { success: true };
  } catch (e: any) {
    console.error('[PurchaseService] restorePurchases error:', e);
    return { success: false, error: e?.message ?? 'Failed to restore purchases' };
  }
}

// ── Get current active entitlements ──────────────────────────────────────────
export async function getCurrentEntitlements() {
  const loaded = await loadPlugin();
  if (!loaded) return null;

  try {
    const result = await NativePurchases.getCurrentEntitlements();
    console.log('[PurchaseService] Entitlements:', result);
    return result;
  } catch (e: any) {
    console.error('[PurchaseService] getCurrentEntitlements error:', e);
    return null;
  }
}
