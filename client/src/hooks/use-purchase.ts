/**
 * usePurchase — React hook for Google Play Billing via @capgo/native-purchases
 * Usage:
 *   const { products, loading, purchase, restore, billingSupported } = usePurchase();
 */

import { useState, useEffect, useCallback } from 'react';
import {
  checkBillingSupported,
  getSubscriptionProducts,
  purchaseSubscription,
  restorePurchases,
  getCurrentEntitlements,
  SPOTLY_PRODUCTS,
  SPOTLY_PLANS,
  type SpotlySubscriptionProduct,
  type PurchaseResult,
  type BillingStatus,
} from '@/lib/purchase-service';

export interface UsePurchaseReturn {
  billingStatus: BillingStatus | null;
  billingSupported: boolean;
  products: SpotlySubscriptionProduct[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  purchase: (
    productId?: (typeof SPOTLY_PRODUCTS)[keyof typeof SPOTLY_PRODUCTS],
    planId?: (typeof SPOTLY_PLANS)[keyof typeof SPOTLY_PLANS],
  ) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  refetchProducts: () => Promise<void>;
  entitlements: any;
}

export function usePurchase(): UsePurchaseReturn {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [products, setProducts] = useState<SpotlySubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<any>(null);

  const init = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await checkBillingSupported();
      setBillingStatus(status);

      if (status.isSupported) {
        const [prods, ents] = await Promise.all([
          getSubscriptionProducts(),
          getCurrentEntitlements(),
        ]);
        setProducts(prods);
        setEntitlements(ents);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to initialise billing');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const purchase = useCallback(
    async (
      productId: (typeof SPOTLY_PRODUCTS)[keyof typeof SPOTLY_PRODUCTS] = SPOTLY_PRODUCTS.PREMIUM_MONTHLY,
      planId: (typeof SPOTLY_PLANS)[keyof typeof SPOTLY_PLANS] = SPOTLY_PLANS.MONTHLY,
    ): Promise<PurchaseResult> => {
      setPurchasing(true);
      setError(null);
      try {
        const result = await purchaseSubscription(productId, planId);
        if (!result.success && result.error) setError(result.error);
        return result;
      } finally {
        setPurchasing(false);
      }
    },
    [],
  );

  const restore = useCallback(async (): Promise<PurchaseResult> => {
    setPurchasing(true);
    setError(null);
    try {
      const result = await restorePurchases();
      if (!result.success && result.error) setError(result.error);
      return result;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const refetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const prods = await getSubscriptionProducts();
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    billingStatus,
    billingSupported: billingStatus?.isSupported ?? false,
    products,
    loading,
    purchasing,
    error,
    purchase,
    restore,
    refetchProducts,
    entitlements,
  };
}
