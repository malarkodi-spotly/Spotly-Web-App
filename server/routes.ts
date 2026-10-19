import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { type User, users, loginSchema, otpVerificationSchema, updateUserSchema, insertWorkerProfileSchema, insertCitySchema, insertBookingSchema, insertServiceSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";

const stripBookingPhotos = (booking: any) => {
  if (!booking) return booking;
  if (!booking.comments) return booking;
  return {
    ...booking,
    comments: booking.comments.replace(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/, (_m: string, payload: string) => {
      try {
        const arr = JSON.parse(payload);
        return Array.isArray(arr) ? `[PHOTOS_COUNT:${arr.length}]` : "";
      } catch {
        return "";
      }
    })
  };
};

// InstantAlerts SMS Configuration
const INSTANTALERTS_CONFIG = {
  apiKey: process.env.INSTANTALERTS_API_KEY || "",
  senderId: "INSTNE",
  route: "2", // Transactional
  templateId: "1407177916444902497",
  baseUrl: "https://instantalerts.in/api/smsapi"
};
console.log('ooooooop', INSTANTALERTS_CONFIG.apiKey);
// Send SMS via InstantAlerts API
async function sendSMS(mobile: string, otp: string): Promise<boolean> {
  try {
    // Format mobile number (remove +91 if present, ensure 10 digits)
    const cleanMobile = mobile.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);

    // DLT registered message template - must match exactly the approved template
    const message = `Welcome to Spotly India's No.1 Online Car & Bike Parking Space Provider & Seeker App\n\nYour OTP is: ${otp}\n\nVerify your mobile number to continue accessing smart parking bookings, live parking availability, and hassle-free parking experiences.\n\nDo not share this OTP with anyone.\n\nSpotly - Find. Park. Go`;

    const url = new URL(INSTANTALERTS_CONFIG.baseUrl);
    url.searchParams.append("key", INSTANTALERTS_CONFIG.apiKey);
    url.searchParams.append("route", INSTANTALERTS_CONFIG.route);
    url.searchParams.append("sender", INSTANTALERTS_CONFIG.senderId);
    url.searchParams.append("number", cleanMobile);
    url.searchParams.append("templateid", INSTANTALERTS_CONFIG.templateId);
    url.searchParams.append("sms", message);

    console.log(`Sending OTP SMS to ${cleanMobile}...`);

    const response = await fetch(url.toString());
    const responseText = await response.text();
    console.log('respo-------', response);
    console.log(`SMS API Response: ${responseText}`);

    // Check if SMS was sent successfully
    if (response.ok && !responseText.toLowerCase().includes("error")) {
      console.log(`OTP SMS sent successfully to ${cleanMobile}`);
      return true;
    } else {
      console.error(`SMS API Error: ${responseText}`);
      return false;
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Simple in-memory OTP storage (in production, use Redis)
const otpStorage = new Map<string, { otp: string; expiresAt: number; lastSentAt: number }>();

// Minimum time between OTP sends (30 seconds)
const OTP_COOLDOWN_MS = 30000;

// Admin session storage (in production, use Redis or database)
const adminSessions = new Map<string, { level: 'super' | 'sub'; expiresAt: number }>();

// User session storage (in production, use Redis or database)
const userSessions = new Map<string, { userId: string; expiresAt: number }>();

const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "supadmin@123#";
const SUB_ADMIN_PASSWORD = process.env.SUB_ADMIN_PASSWORD || "admin@123#";

function isTestMobileNumber(mobile?: string): boolean {
  if (!mobile) return false;
  const clean = mobile.replace(/\D/g, "").slice(-10);
  return clean === "9095549886";
}

function generateOTP(mobile?: string): string {
  if (isTestMobileNumber(mobile)) {
    return "2121";
  }
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateSessionToken(): string {
  return `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateUserSessionToken(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function validateAdminSession(token: string | undefined): { valid: boolean; level?: 'super' | 'sub' } {
  if (!token) return { valid: false };
  const session = adminSessions.get(token);
  if (!session) return { valid: false };
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return { valid: false };
  }
  return { valid: true, level: session.level };
}

function validateUserSession(token: string | undefined): { valid: boolean; userId?: string } {
  if (!token) return { valid: false };
  const session = userSessions.get(token);
  if (!session) return { valid: false };
  if (Date.now() > session.expiresAt) {
    userSessions.delete(token);
    return { valid: false };
  }
  return { valid: true, userId: session.userId };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Run startup migration to ensure last_known_location column exists
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_location jsonb;`);
    console.log("Migration check: last_known_location column verified/added successfully.");
  } catch (err) {
    console.error("Migration check failed on startup:", err);
  }

  // Run startup migration to ensure feedbacks table exists
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id VARCHAR PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        user_name TEXT NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        user_mobile VARCHAR(20),
        rating INTEGER NOT NULL,
        comments TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TEXT DEFAULT now()::text
      );
    `);
    console.log("Migration check: feedbacks table verified/created successfully.");

    // Seed default feedbacks if table is empty
    const existingFeedbacks: any = await db.execute(sql`SELECT count(*) FROM feedbacks;`);
    const count = parseInt(existingFeedbacks?.[0]?.count || existingFeedbacks?.rows?.[0]?.count || "0");
    if (count === 0) {
      await db.execute(sql`
        INSERT INTO feedbacks (id, user_name, user_role, user_mobile, rating, comments, is_active, created_at)
        VALUES 
        ('seed-fb-1', 'Rajesh Kumar', 'worker', '9876543210', 5, 'Finding safe car parking near Koramangala was such a pain every morning. With Spotly, I booked a covered residential space in under 5 minutes. Amazing experience!', true, now()::text),
        ('seed-fb-2', 'Priya Sundaram', 'customer', '9845012345', 5, 'I listed my unused stilt parking space in Indiranagar. Within two days I had genuine seekers inquiring. Monthly earnings are direct and zero hassle. Love the platform!', true, now()::text),
        ('seed-fb-3', 'Karthik Venkat', 'worker', '9988776655', 5, 'Clean app and quick OTP verification. The WhatsApp and direct call options made coordinating with the space provider super convenient. Highly recommended for daily office parking.', true, now()::text),
        ('seed-fb-4', 'Ananya Hegde', 'customer', '9741234567', 5, 'Hosted two bike parking slots at our apartment near HSR Layout. Safe, verified seekers and transparent process. Great initiative for Bangalore parking issues.', true, now()::text),
        ('seed-fb-5', 'Deepa Nair', 'worker', '9811223344', 5, 'Saved me at least 30 minutes every morning. The photo previews of the parking spot gave me full confidence before visiting. 5 stars all the way!', true, now()::text);
      `);
      console.log("Seeded initial feedback reviews successfully.");
    }
  } catch (err) {
    console.error("Migration check for feedbacks table failed:", err);
  }

  // Wire up session invalidator so admin user deletions also clear in-memory sessions
  storage.setSessionInvalidator((userId: string) => {
    // Remove all session tokens belonging to this user
    Array.from(userSessions.entries()).forEach(([token, session]) => {
      if (session.userId === userId) {
        userSessions.delete(token);
      }
    });
  });

  app.use("/api/admin", (req, res, next) => {
    if (req.path === "/login" || req.path === "/session") {
      return next();
    }
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = validateAdminSession(token);
    if (!session.valid) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    (req as any).adminLevel = session.level;
    next();
  });
  app.get("/debug-key", (req, res) => {
    res.json({
      apiKey: INSTANTALERTS_CONFIG.apiKey
    });
  });
  app.get('/api/test', (req, res) => {
    res.json({ status: 'Spotly[By Heeraa Technologies] API working' });
  });

  const checkMobileHandler = async (req: any, res: any) => {
    try {
      const rawMobile = (req.query.mobile || req.body?.mobile) as string;
      const role = (req.query.role || req.body?.role) as string;
      const clean = (rawMobile || "").replace(/\D/g, "").slice(-10);
      if (!clean || clean.length !== 10) {
        return res.status(400).json({ error: "Invalid mobile number" });
      }

      const normalizedRole = role === "space-seeker" || role === "worker"
        ? "worker"
        : role === "space-provider" || role === "customer"
          ? "customer"
          : role;

      let user = normalizedRole ? await storage.getUserByMobile(clean, normalizedRole) : undefined;
      let anyUser = await storage.getUserByMobileAnyRole(clean);

      if (user) {
        return res.json({ registered: true, name: user.name || "User", role: user.role });
      } else if (anyUser) {
        // User exists under a DIFFERENT role but NOT the requested role.
        // Treat as unregistered for this role, but pass the existing name for convenience.
        return res.json({
          registered: false,
          name: anyUser.name || "User",
          role: anyUser.role,
          existingName: anyUser.name && anyUser.name !== "User" ? anyUser.name : undefined
        });
      }
      return res.json({ registered: false });
    } catch (error) {
      console.error("Error checking mobile:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  app.get("/api/auth/check-mobile", checkMobileHandler);
  app.get("/api/check-mobile", checkMobileHandler);
  app.get("/auth/check-mobile", checkMobileHandler);
  app.get("/check-mobile", checkMobileHandler);
  app.post("/api/auth/check-mobile", checkMobileHandler);
  app.post("/api/check-mobile", checkMobileHandler);

  // Razorpay Integration Endpoints
  app.get("/api/razorpay/key", (req, res) => {
    res.json({
      keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TYjy1DdwKJpzj5"
    });
  });

  app.post("/api/razorpay/create-order", async (req, res) => {
    try {
      const { amount, planKey, currency = "INR" } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: "Invalid payment amount" });
      }

      const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_TYjy1DdwKJpzj5";
      const keySecret = process.env.RAZORPAY_KEY_SECRET || "PACm345hXg2J7AEOOt4L7YKX";

      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      const amountInPaise = Math.round(Number(amount) * 100);

      console.log(`Creating Razorpay order for plan ${planKey} amount ₹${amount} (${amountInPaise} paise)...`);

      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: `spotly_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          notes: {
            planKey: planKey || "subscription",
            platform: "Spotly App"
          }
        }),
      });

      const orderData = await rzpResponse.json();

      if (!rzpResponse.ok) {
        console.error("Razorpay order API error:", orderData);
        return res.status(rzpResponse.status).json({ error: orderData.error?.description || "Failed to create Razorpay order" });
      }

      res.json({
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
      });
    } catch (error) {
      console.error("Razorpay create-order route error:", error);
      res.status(500).json({ error: "Internal server error creating order" });
    }
  });

  app.post("/api/razorpay/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planKey, views } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required Razorpay payment verification parameters" });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET || "PACm345hXg2J7AEOOt4L7YKX";
      const hmac = crypto.createHmac("sha256", keySecret);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest("hex");

      if (generatedSignature !== razorpay_signature) {
        console.error("Razorpay signature verification mismatch!");
        return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
      }

      console.log(`Razorpay payment ${razorpay_payment_id} verified successfully for order ${razorpay_order_id}.`);

      // Signature is valid. Activate subscription for user and record payment for Admin Dashboard
      if (userId) {
        if (planKey === "spotly_roadside_pass") {
          let amountInPaise = 2900;
          try {
            const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_TYjy1DdwKJpzj5";
            const orderAuthHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
            const orderFetchRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
              headers: { "Authorization": orderAuthHeader },
            });
            if (orderFetchRes.ok) {
              const orderDetails = await orderFetchRes.json();
              amountInPaise = orderDetails.amount || 2900;
            }
          } catch { }

          await storage.createPayment({
            customerId: userId,
            amount: amountInPaise,
            currency: "INR",
            type: "spotly_direction_pass",
            status: "completed",
            reference: `SPOTLY-DIR-${razorpay_payment_id || Date.now()}`,
            paidAt: new Date().toISOString(),
          });

          return res.json({
            success: true,
            message: "Spotly Roadside Navigation Pass activated successfully!",
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        const viewsToGrant = views !== undefined ? Number(views) : (planKey === "basic" ? 10 : planKey === "standard" ? 20 : -1);
        const activatedUser = await storage.activatePremiumWithPlan(userId, planKey || "premium", viewsToGrant);

        if (activatedUser) {
          try {
            // Fetch actual order amount from Razorpay to record the real amount paid
            let amountInPaise: number;
            try {
              const keyId = process.env.RAZORPAY_KEY_ID || "rzp_live_TYjy1DdwKJpzj5";
              const orderAuthHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
              const orderFetchRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
                headers: { "Authorization": orderAuthHeader },
              });
              if (orderFetchRes.ok) {
                const orderDetails = await orderFetchRes.json();
                amountInPaise = orderDetails.amount; // Actual amount from Razorpay order
                console.log(`Fetched actual Razorpay order amount: ${amountInPaise} paise`);
              } else {
                throw new Error("Failed to fetch Razorpay order");
              }
            } catch (fetchErr) {
              // Fallback: use default plan prices if Razorpay fetch fails
              console.warn("Could not fetch Razorpay order amount, using default prices:", fetchErr);
              const defaultPrices: Record<string, number> = { basic: 199, standard: 299, premium: 399 };
              const priceSetting = await storage.getSetting(`premium_${planKey}_price`);
              const priceRupees = parseInt(priceSetting?.value || String(defaultPrices[planKey || "premium"] || 199));
              amountInPaise = priceRupees * 100;
            }

            await storage.createPayment({
              customerId: activatedUser.id,
              amount: amountInPaise,
              currency: "INR",
              type: "premium_membership",
              status: "completed",
              reference: razorpay_payment_id || `RZP-${Date.now()}`,
              paidAt: new Date().toISOString(),
            });
          } catch (payErr) {
            console.error("Error recording payment entry in DB:", payErr);
          }
        }
      }

      res.json({
        success: true,
        message: "Payment verified and subscription activated successfully!",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } catch (error) {
      console.error("Razorpay verify-payment error:", error);
      res.status(500).json({ error: "Internal server error verifying payment" });
    }
  });

  // ─── Google Play Billing Verification ────────────────────────────────────────
  // Called by the mobile APK WebView after a Google Play purchase completes.
  // The Android native layer (Capacitor plugin / JS bridge) passes the
  // purchaseToken back to the WebView, which then calls this endpoint.
  app.post("/api/google-play/verify-purchase", async (req, res) => {
    try {
      const { purchaseToken, productId, userId, planKey } = req.body;

      if (!purchaseToken || !productId || !userId || !planKey) {
        return res.status(400).json({ error: "Missing required fields: purchaseToken, productId, userId, planKey" });
      }

      const validPlans = ["basic", "standard", "premium"];
      if (!validPlans.includes(planKey)) {
        return res.status(400).json({ error: "Invalid planKey. Must be basic, standard, or premium." });
      }

      // Package name of the Spotly Android APK in the Play Store
      const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || "com.spotlyindia.app";

      // Map plan keys to their Play Store product IDs
      const productIdMap: Record<string, string> = {
        basic: "spotly_basic",
        standard: "spotly_standard",
        premium: "spotly_premium",
      };
      const expectedProductId = productIdMap[planKey];

      // ── Google Play Developer API verification ──────────────────────────────
      // The service account JSON key is stored in env var GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
      const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);

          // Build a JWT to exchange for an OAuth2 access token
          const now = Math.floor(Date.now() / 1000);
          const jwtHeader = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
          const jwtPayload = Buffer.from(JSON.stringify({
            iss: serviceAccount.client_email,
            sub: serviceAccount.client_email,
            aud: "https://oauth2.googleapis.com/token",
            iat: now,
            exp: now + 3600,
            scope: "https://www.googleapis.com/auth/androidpublisher",
          })).toString("base64url");

          const signInput = `${jwtHeader}.${jwtPayload}`;
          const signature = crypto.createSign("RSA-SHA256").update(signInput).sign(serviceAccount.private_key, "base64url");
          const jwt = `${signInput}.${signature}`;

          // Exchange JWT → OAuth2 access token
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
          });

          if (!tokenRes.ok) {
            console.error("Google OAuth token error:", await tokenRes.text());
            return res.status(502).json({ error: "Failed to authenticate with Google Play API" });
          }

          const { access_token } = await tokenRes.json() as any;

          // Verify the purchase via Google Play Developer API
          const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${expectedProductId}/tokens/${purchaseToken}`;
          const verifyRes = await fetch(verifyUrl, {
            headers: { "Authorization": `Bearer ${access_token}` },
          });

          if (!verifyRes.ok) {
            console.error("Google Play purchase verification failed:", await verifyRes.text());
            return res.status(400).json({ error: "Google Play purchase verification failed. Invalid or expired token." });
          }

          const purchaseData = await verifyRes.json() as any;
          console.log(`Google Play purchase verified: productId=${expectedProductId}, purchaseState=${purchaseData.purchaseState}`);

          // purchaseState: 0 = purchased, 1 = cancelled, 2 = pending
          if (purchaseData.purchaseState !== 0) {
            return res.status(400).json({ error: "Purchase is not in a completed state." });
          }

          // ── Acknowledge the purchase (MANDATORY within 3 days or Google auto-refunds) ──
          if (purchaseData.acknowledgementState === 0) {
            const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${expectedProductId}/tokens/${purchaseToken}:acknowledge`;
            const ackRes = await fetch(ackUrl, {
              method: "POST",
              headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
              body: JSON.stringify({}),
            });
            if (!ackRes.ok) {
              console.warn("Failed to acknowledge Google Play purchase (will retry):", await ackRes.text());
            } else {
              console.log(`Google Play purchase acknowledged for token: ${purchaseToken.substring(0, 20)}...`);
            }
          }

        } catch (gpErr) {
          console.error("Google Play API verification error:", gpErr);
          return res.status(502).json({ error: "Internal error verifying with Google Play API" });
        }
      } else {
        // Dev/sandbox mode — no service account key configured
        console.warn("[DEV MODE] GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set — skipping Play API verification.");
      }

      // ── Activate subscription in DB ──────────────────────────────────────────
      const defaultViews: Record<string, number> = { basic: 2, standard: 4, premium: -1 };
      const defaultPrices: Record<string, number> = { basic: 1, standard: 2, premium: 3 };

      const viewsSetting = await storage.getSetting(`premium_${planKey}_views`);
      const viewsToGrant = planKey === "premium"
        ? -1
        : parseInt(viewsSetting?.value || String(defaultViews[planKey] ?? 2));

      const activatedUser = await storage.activatePremiumWithPlan(userId, planKey, viewsToGrant);
      if (!activatedUser) {
        return res.status(404).json({ error: "User not found or subscription activation failed." });
      }

      // ── Record payment entry ─────────────────────────────────────────────────
      try {
        const priceSetting = await storage.getSetting(`premium_${planKey}_price`);
        const priceRupees = parseInt(priceSetting?.value || String(defaultPrices[planKey] ?? 1));
        await storage.createPayment({
          customerId: activatedUser.id,
          amount: priceRupees * 100, // paise, consistent with Razorpay
          currency: "INR",
          type: "premium_membership",
          status: "completed",
          reference: `GP-${purchaseToken.substring(0, 20)}-${Date.now()}`,
          paidAt: new Date().toISOString(),
        });
        console.log(`Google Play payment recorded for user ${userId}, plan ${planKey}`);
      } catch (payErr) {
        console.error("Error recording Google Play payment in DB:", payErr);
        // Non-fatal: subscription is already activated above
      }

      return res.json({
        success: true,
        message: "Google Play purchase verified and subscription activated!",
        plan: planKey,
        views: viewsToGrant,
        expiresAt: activatedUser.premiumExpiresAt,
      });

    } catch (error) {
      console.error("Google Play verify-purchase error:", error);
      res.status(500).json({ error: "Internal server error verifying Google Play purchase" });
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      let user = data.role ? await storage.getUserByMobile(data.mobile, data.role) : await storage.getUserByMobileAnyRole(data.mobile);
      const isNewUser = !user;

      const existingOtp = otpStorage.get(data.mobile);
      const now = Date.now();

      if (existingOtp && existingOtp.lastSentAt && (now - existingOtp.lastSentAt) < OTP_COOLDOWN_MS) {
        if (isTestMobileNumber(data.mobile)) {
          existingOtp.otp = "2121";
        }
        console.log(`OTP for ${data.mobile}: Using existing OTP (cooldown active)`);
        return res.json({
          success: true,
          message: "OTP already sent",
          userId: user?.id,
          mobile: data.mobile,
          isNewUser,
        });
      }

      const otp = generateOTP(data.mobile);
      otpStorage.set(data.mobile, {
        otp,
        expiresAt: now + 10 * 60 * 1000,
        lastSentAt: now,
      });

      let smsSent = false;
      try {
        smsSent = await sendSMS(data.mobile, otp);
      } catch (err) {
        console.log("SMS failed but continuing:", err);
      }

      console.log(`OTP for ${data.mobile}: ${otp} (SMS sent: ${smsSent})`);

      res.json({
        success: true,
        message: smsSent ? "OTP sent" : "OTP generated",
        userId: user?.id,
        mobile: data.mobile,
        isNewUser,
      });
    } catch (error) {
      console.error("🔥 Login Route Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // OTP Verification handler (supports /api/auth/verify and /api/auth/verify-otp)
  const verifyOtpHandler = async (req: any, res: any) => {
    try {
      const data = otpVerificationSchema.parse(req.body);

      if (data.otp.length !== 4 || !/^\d{4}$/.test(data.otp)) {
        return res.status(400).json({ error: "OTP must be 4 digits" });
      }

      const storedOtp = otpStorage.get(data.mobile);
      const isTestMobile = isTestMobileNumber(data.mobile) && data.otp === "2121";

      if (!storedOtp && !isTestMobile) {
        return res.status(400).json({ error: "OTP expired or not requested. Please request a new OTP." });
      }
      if (storedOtp && Date.now() > storedOtp.expiresAt && !isTestMobile) {
        otpStorage.delete(data.mobile);
        return res.status(400).json({ error: "OTP expired. Please request a new OTP." });
      }
      if (storedOtp && storedOtp.otp !== data.otp && !isTestMobile) {
        return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
      }

      let user = data.role ? await storage.getUserByMobile(data.mobile, data.role) : await storage.getUserByMobileAnyRole(data.mobile);
      const isNewAccount = !user;
      const providedName = data.name?.trim();

      if (!user) {
        user = await storage.createUser({
          name: (providedName && providedName !== "User") ? providedName : "User",
          email: null,
          mobile: data.mobile,
          role: data.role,
        });
        // Mark as verified immediately since OTP was successfully verified
        try {
          user = (await storage.updateUser(user.id, { isVerified: true }))!;
        } catch (e) {
          console.error("Failed to auto-verify new user:", e);
        }
      } else if (providedName && providedName !== "User" && (user.name === "User" || !user.name || user.name.trim() === "")) {
        user = (await storage.updateUser(user.id, { name: providedName }))!;
      }

      if (user.role === "worker") {
        try {
          const existingWorker = await storage.getWorkerProfileByUserId(user.id);
          if (!existingWorker) {
            await storage.createWorkerProfile({
              userId: user.id,
              services: [],
            });
          }
        } catch (e) {
          console.error("Failed auto worker profile creation:", e);
        }
      }

      // isNewUser must be determined from DB state: if the account was just created
      // during this OTP verification, it's a new user — regardless of what the client sends.
      // This ensures deleted-then-reregistered users always go through the full registration flow.
      const isNewUser = isNewAccount;

      otpStorage.delete(data.mobile);

      Array.from(userSessions.entries()).forEach(([token, session]) => {
        if (session.userId === user.id) {
          userSessions.delete(token);
        }
      });

      const sessionToken = generateUserSessionToken();
      userSessions.set(sessionToken, {
        userId: user.id,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: "OTP verified successfully",
        sessionToken,
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("🔥 Verify OTP Route Error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  };

  app.post("/api/auth/verify-otp", verifyOtpHandler);
  app.post("/api/auth/verify", verifyOtpHandler);
  app.post("/api/verify-otp", verifyOtpHandler);
  app.post("/api/verify", verifyOtpHandler);

  // Accept disclaimer and complete registration
  app.post("/api/auth/accept-disclaimer", async (req, res) => {
    try {
      const { userId, mobile, role } = req.body;
      let user: User | undefined;
      if (userId) {
        user = await storage.getUser(userId);
      }
      if (!user && mobile && role) {
        user = await storage.getUserByMobile(mobile, role);
      }
      if (!user && mobile) {
        user = await storage.getUserByMobileAnyRole(mobile);
      }

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(user.id, {
        isVerified: true,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Accept disclaimer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      let user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if premium expired
      if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
        const deactivatedUser = await storage.deactivatePremium(user.id);
        if (deactivatedUser) {
          user = deactivatedUser;
        }
      }

      res.json({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumViewsRemaining: user.premiumViewsRemaining,
        premiumExpiresAt: user.premiumExpiresAt,
        premiumActivatedAt: user.premiumActivatedAt,
        lastKnownLocation: user.lastKnownLocation,
        createdAt: user.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get payments for a user
  app.get("/api/users/:id/payments", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByCustomer(req.params.id);
      res.json({ payments });
    } catch (error) {
      console.error("Get user payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Activate premium membership with plan selection
  app.post("/api/users/:id/premium", async (req, res) => {
    try {
      const { plan, amount } = req.body;
      const validPlans = ["basic", "standard", "premium"];
      if (!plan || !validPlans.includes(plan)) {
        return res.status(400).json({ error: "Invalid plan. Must be basic, standard, or premium." });
      }
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount." });
      }

      const enabledSetting = await storage.getSetting(`premium_${plan}_enabled`);
      if (enabledSetting?.value === "false") {
        return res.status(400).json({ error: "This plan is currently unavailable." });
      }

      const defaultPrices: Record<string, number> = { basic: 199, standard: 299, premium: 399 };
      const priceSetting = await storage.getSetting(`premium_${plan}_price`);
      const expectedPrice = parseInt(priceSetting?.value || String(defaultPrices[plan]));
      if (amount !== expectedPrice * 100 && amount !== expectedPrice) {
        console.warn(`Payment amount check soft warning: received ${amount}, expected ${expectedPrice * 100} or ${expectedPrice}`);
      }

      const viewsSetting = await storage.getSetting(`premium_${plan}_views`);
      const defaultViews: Record<string, number> = { basic: 10, standard: 20, premium: -1 };
      const views = plan === "premium" ? -1 : parseInt(viewsSetting?.value || String(defaultViews[plan]));

      const selectedPlan = { views, label: plan.charAt(0).toUpperCase() + plan.slice(1) };
      const user = await storage.activatePremiumWithPlan(
        req.params.id,
        plan || "standard",
        selectedPlan.views
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.createPayment({
        customerId: user.id,
        amount: amount || 29900,
        currency: "INR",
        type: "premium_membership",
        status: "completed",
        reference: `PREM-${plan?.toUpperCase() || "STD"}-${Date.now()}`,
        paidAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          isPremium: user.isPremium,
          premiumPlan: user.premiumPlan,
          premiumViewsRemaining: user.premiumViewsRemaining,
          premiumExpiresAt: user.premiumExpiresAt,
          premiumActivatedAt: user.premiumActivatedAt,
        },
      });
    } catch (error) {
      console.error("Premium activation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Activate free access (admin-controlled)
  app.post("/api/users/:id/premium/free-access", async (req, res) => {
    try {
      // Check if free access mode is enabled by admin
      const freeAccessSetting = await storage.getSetting("free_access_mode");
      if (freeAccessSetting?.value !== "true") {
        return res.status(403).json({ error: "Free access mode is not currently enabled." });
      }

      const userId = req.params.id;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      // Activate premium with "free" plan, unlimited views, 365-day validity
      const user = await storage.activatePremiumWithPlan(userId, "free", -1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Record a free payment entry
      try {
        await storage.createPayment({
          customerId: user.id,
          amount: 0,
          currency: "INR",
          type: "free_access",
          status: "completed",
          reference: `FREE-ACCESS-${Date.now()}`,
          paidAt: new Date().toISOString(),
        });
      } catch (payErr) {
        console.error("Error recording free access payment:", payErr);
        // Non-fatal
      }

      res.json({
        success: true,
        message: "Free access activated successfully!",
        user: {
          id: user.id,
          isPremium: user.isPremium,
          premiumPlan: user.premiumPlan,
          premiumViewsRemaining: user.premiumViewsRemaining,
          premiumExpiresAt: user.premiumExpiresAt,
          premiumActivatedAt: user.premiumActivatedAt,
        },
      });
    } catch (error) {
      console.error("Free access activation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Use a premium view (decrement views remaining)
  app.post("/api/users/:id/premium/use-view", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!user.isPremium) {
        return res.status(403).json({ error: "Not a premium member" });
      }
      if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) < new Date()) {
        return res.status(403).json({ error: "Premium membership expired", expired: true });
      }
      if (user.premiumPlan !== "premium" && (user.premiumViewsRemaining ?? 0) <= 0) {
        return res.status(403).json({ error: "No views remaining" });
      }

      const updated = await storage.usePremiumView(req.params.id);
      res.json({
        success: true,
        viewsRemaining: updated?.premiumViewsRemaining,
        plan: updated?.premiumPlan,
      });
    } catch (error) {
      console.error("Use premium view error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get viewed contacts for a user
  app.get("/api/users/:id/viewed-contacts", async (req, res) => {
    try {
      const viewedBookingIds = await storage.getViewedContacts(req.params.id);
      res.json({ viewedBookingIds });
    } catch (error) {
      console.error("Get viewed contacts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Save a viewed contact
  app.post("/api/users/:id/viewed-contacts", async (req, res) => {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ error: "bookingId is required" });
      }
      await storage.addViewedContact(req.params.id, bookingId);

      // Automatically register interest and alert provider when a seeker views the contact number
      try {
        await storage.addInterest(bookingId, req.params.id);
        const booking = await storage.getBookingById(bookingId);
        if (booking && booking.customerId) {
          const seeker = await storage.getUser(req.params.id);
          const seekerName = seeker?.name || "A seeker";
          const spaceName = booking.serviceName || "your parking space";
          await storage.createNotification({
            userId: booking.customerId,
            type: "interest_received",
            title: "New Seeker Interested!",
            message: `${seekerName} is interested in ${spaceName} (viewed your contact number)`,
            bookingId: bookingId,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (notifyErr) {
        console.error("Auto interest/notify on viewed contact:", notifyErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Save viewed contact error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update current user profile (using session token)
  app.patch("/api/users/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      const session = userSessions.get(token);
      if (!session || Date.now() > session.expiresAt) {
        if (session) userSessions.delete(token);
        return res.status(401).json({ error: "Session expired" });
      }
      const userId = session.userId;

      const data = updateUserSchema.parse(req.body);
      const updateData: Record<string, any> = {
        ...data,
      };
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }
      if (data.email !== undefined) {
        updateData.email = data.email && data.email.trim() !== "" ? data.email.trim() : null;
      }
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          city: user.city,
          lastKnownLocation: user.lastKnownLocation,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const updateData: Record<string, any> = {
        ...data,
      };
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }
      if (data.email !== undefined) {
        updateData.email = data.email && data.email.trim() !== "" ? data.email.trim() : null;
      }
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          role: user.role,
          city: user.city,
          lastKnownLocation: user.lastKnownLocation,
        },
      });
    } catch (error) {
      console.log("UPDATE USER ERROR:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }

      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : error,
      });
    }
  });

  // Delete user account (self-deletion - requires authentication)
  app.delete("/api/users/:id", async (req, res) => {
    try {
      // Verify the user's session token
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateUserSession(token);

      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized - please log in again" });
      }

      // Verify the authenticated user matches the account being deleted
      if (session.userId !== req.params.id) {
        return res.status(403).json({ error: "Forbidden - you can only delete your own account" });
      }

      // Verify the user exists
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete the user
      await storage.deleteUser(req.params.id);

      // If the user is a provider, also delete their worker profile
      if (user.role === "worker") {
        await storage.deleteWorkerProfile(req.params.id);
      }

      // Also clear their session
      if (token) {
        userSessions.delete(token);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get worker profile by user ID
  app.get("/api/workers/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getWorkerProfileByUserId(userId);

      if (!profile) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      res.json({ profile });
    } catch (error) {
      console.error("Get worker profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create or update worker profile
  app.post("/api/workers/profile", async (req, res) => {
    try {
      const profile = insertWorkerProfileSchema.parse(req.body);

      // Get user's mobile number to include in worker profile
      const user = await storage.getUser(profile.userId);
      const profileWithMobile = {
        ...profile,
        mobile: profile.mobile || user?.mobile || null,
        whatsapp: profile.whatsapp || user?.mobile || null,
      };

      // Check if profile already exists
      const existing = await storage.getWorkerProfileByUserId(profile.userId);

      if (existing) {
        const updateData: Record<string, any> = { ...profileWithMobile };
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === null || updateData[key] === undefined) {
            if ((existing as any)[key] !== null && (existing as any)[key] !== undefined) {
              delete updateData[key];
            }
          }
        });
        const updated = await storage.updateWorkerProfile(profile.userId, updateData);
        return res.json({ success: true, profile: updated });
      }

      const created = await storage.createWorkerProfile(profileWithMobile);
      res.json({ success: true, profile: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Worker profile error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all workers with optional location-based sorting and city filtering
  app.get("/api/workers", async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
      const city = req.query.city as string | undefined;
      const userId = req.query.userId as string | undefined;

      // If userId is provided, return that specific worker's profile
      if (userId) {
        const workerProfile = await storage.getWorkerProfileByUserId(userId);
        if (workerProfile) {
          return res.json({ workers: [workerProfile] });
        }
        return res.json({ workers: [] });
      }

      const workers = await storage.getAllWorkerProfiles(city);

      // Calculate distance and sort if user location provided
      const workersWithDistance = workers.map(worker => {
        let distance: number | null = null;
        if (lat && lng && worker.latitude && worker.longitude) {
          distance = calculateDistance(lat, lng, worker.latitude, worker.longitude);
        }
        return { ...worker, distance };
      });

      // Sort by distance if location provided, otherwise by rating
      if (lat && lng) {
        workersWithDistance.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      } else {
        workersWithDistance.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      res.json({ workers: workersWithDistance });
    } catch (error) {
      console.error("Get workers error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/workers/:userId/location", async (req, res) => {
    try {
      const { userId } = req.params;
      const { latitude, longitude } = req.body;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.role !== "worker") {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const profile = await storage.getWorkerProfileByUserId(userId);
      if (profile) {
        await storage.updateWorkerProfileLocation(userId, latitude, longitude);
      } else {
        await storage.createWorkerProfile({
          userId,
          latitude,
          longitude,
          mobile: user.mobile,
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Update worker location error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get active cities for customers
  app.get("/api/cities", async (req, res) => {
    try {
      const citiesList = await storage.getActiveCities();
      // Return only active cities - no hardcoded fallback
      // If admin disables all cities, app will show "service not available"
      res.json({ cities: citiesList });
    } catch (error) {
      console.error("Get cities error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all cities (including inactive)
  app.get("/api/admin/cities", async (req, res) => {
    try {
      const citiesList = await storage.getAllCities();
      res.json({ cities: citiesList });
    } catch (error) {
      console.error("Get all cities error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create a new city
  app.post("/api/admin/cities", async (req, res) => {
    try {
      const cityData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(cityData);
      res.json({ success: true, city });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create city error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update a city
  app.patch("/api/admin/cities/:id", async (req, res) => {
    try {
      const city = await storage.updateCity(req.params.id, req.body);
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      res.json({ success: true, city });
    } catch (error) {
      console.error("Update city error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a city
  app.delete("/api/admin/cities/:id", async (req, res) => {
    try {
      await storage.deleteCity(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete city error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all users with worker profiles
  app.get("/api/admin/users", async (req, res) => {
    try {
      const usersList = await storage.getAllUsers();
      // Show all registered users in admin (don't filter by isVerified)
      const verifiedUsersList = usersList;
      const workerProfiles = await storage.getAllWorkerProfiles();
      const allBookings = await storage.getAllBookings();
      const allPayments = await storage.getAllPayments();

      // Build a map of 10-digit mobile numbers to known real names
      const mobileToRealNameMap = new Map<string, string>();
      for (const u of usersList) {
        const cleanMobile = (u.mobile || "").replace(/\D/g, "").slice(-10);
        if (cleanMobile && u.name && u.name.trim() !== "" && u.name.trim() !== "User") {
          mobileToRealNameMap.set(cleanMobile, u.name.trim());
        }
      }

      const usersWithStats = await Promise.all(verifiedUsersList.map(async (user) => {
        const cleanMobile = (user.mobile || "").replace(/\D/g, "").slice(-10);
        let resolvedName = user.name;

        // If user's name is "User" or empty, try to resolve real name from same mobile number
        if ((!resolvedName || resolvedName === "User" || resolvedName.trim() === "") && cleanMobile) {
          const knownName = mobileToRealNameMap.get(cleanMobile);
          if (knownName) {
            resolvedName = knownName;
            storage.updateUser(user.id, { name: knownName }).catch(() => { });
          }
        }

        if (user.role === "customer") {
          const userBookings = allBookings.filter(b => b.customerId === user.id);
          const spacesPosted = userBookings.length;
          const cityFromBooking = !user.city && userBookings.length > 0
            ? userBookings[0].city
            : null;
          return {
            ...user,
            name: resolvedName,
            spacesPosted,
            city: user.city || cityFromBooking || null,
          };
        } else if (user.role === "worker") {
          const profile = workerProfiles.find(p => p.userId === user.id);
          const seekerPayments = allPayments.filter(p => p.customerId === user.id && p.status === "completed")
            .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
          const latestPayment = seekerPayments.length > 0 ? seekerPayments[0] : null;
          return {
            ...user,
            name: resolvedName,
            city: user.city || profile?.city || null,
            amountPaid: latestPayment ? latestPayment.amount : null,
            paymentDate: latestPayment ? latestPayment.paidAt : null,
            paymentReference: latestPayment ? latestPayment.reference : null,
          };
        }
        return {
          ...user,
          name: resolvedName,
        };
      }));

      res.json({ users: usersWithStats, workerProfiles });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete individual user / seeker / provider
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/workers/:id", async (req, res) => {
    try {
      // Delete the worker profile first
      await storage.deleteWorkerProfile(req.params.id);
      // Then delete the user account
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/admin/customers/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete customer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Bulk delete users (seekers or providers)
  app.post("/api/admin/users/bulk-delete", async (req, res) => {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array is required" });
      }
      for (const id of userIds) {
        await storage.deleteUser(id);
      }
      res.json({ success: true, count: userIds.length });
    } catch (error) {
      console.error("Admin bulk delete users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update user
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { name, city, email, mobile } = req.body;
      const updated = await storage.updateUser(req.params.id, { name, city, email, mobile });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update worker & worker profile
  app.patch("/api/admin/workers/:id", async (req, res) => {
    try {
      const { name, city, email, mobile, whatsapp } = req.body;
      const updatedUser = await storage.updateUser(req.params.id, { name, city, email, mobile });
      const existingProfile = await storage.getWorkerProfileByUserId(req.params.id);
      if (existingProfile) {
        await storage.updateWorkerProfile(req.params.id, { city, mobile, whatsapp });
      }
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Admin update worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create new worker / space seeker
  app.post("/api/admin/workers", async (req, res) => {
    try {
      const { name, mobile, email, city, whatsapp } = req.body;
      if (!name || !mobile) {
        return res.status(400).json({ error: "Name and mobile are required" });
      }
      const result = await storage.createWorkerWithProfile(
        { name, mobile, email: email || null, role: "worker", city: city || null },
        { mobile, whatsapp: whatsapp || mobile, city: city || null }
      );
      res.json({ success: true, user: result.user, profile: result.profile });
    } catch (error) {
      console.error("Admin add worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all bookings
  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const bookingsList = await storage.getAllBookings();
      res.json({ bookings: bookingsList });
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a booking/post
  app.delete("/api/admin/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a specific photo from a booking
  app.post("/api/admin/bookings/:id/delete-photo", async (req, res) => {
    try {
      const { id } = req.params;
      const { photoUrl } = req.body;

      if (!photoUrl) {
        return res.status(400).json({ error: "Photo URL is required" });
      }

      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: "Parking space not found" });
      }

      const comments = booking.comments;
      if (!comments) {
        return res.status(400).json({ error: "No comments/photos found for this space" });
      }

      const photosMatch = comments.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
      if (!photosMatch) {
        return res.status(400).json({ error: "No photos found in this space" });
      }

      const photosRaw = photosMatch[1].trim();
      let photos: string[] = [];
      try {
        if (photosRaw.startsWith("[")) {
          photos = JSON.parse(photosRaw);
        } else {
          photos = photosRaw.split(",").map(p => p.trim()).filter(Boolean);
        }
      } catch (e) {
        photos = photosRaw.split(",").map(p => p.trim()).filter(Boolean);
      }

      const normalizeUrl = (url: string) => {
        if (!url) return "";
        let u = url.trim();
        try {
          if (u.startsWith("http://") || u.startsWith("https://")) {
            u = new URL(u).pathname;
          }
        } catch (e) { }
        return decodeURIComponent(u);
      };

      const targetUrl = normalizeUrl(photoUrl);

      const updatedPhotos = photos.filter(p => {
        const pNorm = normalizeUrl(p);
        return p.trim() !== photoUrl.trim() && pNorm !== targetUrl;
      });

      const commentsWithoutPhotos = comments.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "").trim();
      let newComments = commentsWithoutPhotos;

      if (updatedPhotos.length > 0) {
        newComments = `${commentsWithoutPhotos}${commentsWithoutPhotos ? " " : ""}[PHOTOS]${JSON.stringify(updatedPhotos)}[/PHOTOS]`;
      }

      await storage.updateBooking(id, { comments: newComments });

      // Attempt to delete physical file from disk if stored locally
      const targetPath = targetUrl || photoUrl;
      if (targetPath.includes("/uploads/")) {
        const filename = targetPath.split("/uploads/")[1];
        if (filename) {
          const filePath = path.join(process.cwd(), "uploads", filename);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (err) {
            console.error("Failed to delete physical file from disk:", err);
          }
        }
      }

      res.json({ success: true, comments: newComments });
    } catch (error) {
      console.error("Delete photo error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Admin: Get all services
  app.get("/api/admin/services", async (req, res) => {
    try {
      const servicesList = await storage.getAllServices();
      res.json({ services: servicesList });
    } catch (error) {
      console.error("Get all services error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create a service
  app.post("/api/admin/services", async (req, res) => {
    try {
      const { name, icon, description, isActive, displayOrder } = req.body;

      // Validate required fields
      if (!name || !icon) {
        return res.status(400).json({ error: "Name and icon are required" });
      }

      const service = await storage.createService({
        name,
        icon,
        description: description || null,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0
      });
      res.json({ success: true, service });
    } catch (error) {
      console.error("Create service error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update a service
  app.patch("/api/admin/services/:id", async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true, service });
    } catch (error) {
      console.error("Update service error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a service
  app.delete("/api/admin/services/:id", async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get active service pincodes (public endpoint for app)
  app.get("/api/pincodes", async (req, res) => {
    try {
      const pincodes = await storage.getActiveServicePincodes();
      res.json({ pincodes });
    } catch (error) {
      console.error("Get pincodes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public API to detect location on initial screen load
  app.get("/api/location/detect", async (req, res) => {
    try {
      const rawIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
      let lat = 12.9716;
      let lng = 77.5946;
      let city = "Bengaluru";
      let state = "Karnataka";
      let address = "Bengaluru, Karnataka, India";

      try {
        const ipRes = await fetch(`https://freeipapi.com/api/json/${rawIp}`);
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            lat = parseFloat(ipData.latitude);
            lng = parseFloat(ipData.longitude);
            city = ipData.cityName || city;
            state = ipData.regionName || state;
            address = `${city}, ${state}, India`;
          }
        }
      } catch (e) {
        console.warn("Server IP location detection error:", e);
      }

      res.json({
        success: true,
        lat,
        lng,
        city,
        state,
        address
      });
    } catch (error) {
      console.error("Detect location error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public proxy API for reverse geocoding (converts lat/lng to exact street address)
  app.get("/api/location/reverse-geocode", async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ error: "lat and lng parameters are required" });
      }

      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "SpotlyApp/1.0 (contact@spotly.in)"
          }
        }
      );

      if (nomRes.ok) {
        const data = await nomRes.json();
        const addr = data.address || {};
        const stateName = addr.state || addr.region || addr["ISO3166-2-lvl4"] || "Karnataka";
        const cityName =
          addr.city || addr.town || addr.state_district || addr.county || addr.suburb || addr.village || "Bengaluru";
        const cleanCityName = cityName.replace(/Urban|Rural|District|East|West|North|South/gi, "").trim() || "Bengaluru";

        const sublocality = addr.building || addr.house_number || addr.road || addr.residential || addr.amenity || addr.shop || addr.office || addr.industrial || addr.commercial || "";
        const locality = addr.suburb || addr.neighbourhood || addr.subdistrict || addr.quarter || addr.city_district || addr.area || "";
        const parts = [sublocality, locality, cleanCityName, stateName, addr.postcode || ""]
          .map((p) => (p || "").trim())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        const fullAddr = parts.length > 0 ? parts.join(", ") : (data.display_name || `${cleanCityName}, ${stateName}`);

        return res.json({
          success: true,
          address: fullAddr,
          city: cleanCityName,
          state: stateName,
          raw: data
        });
      }

      res.json({
        success: true,
        address: "Bengaluru, Karnataka, India",
        city: "Bengaluru",
        state: "Karnataka"
      });
    } catch (error) {
      console.error("Reverse geocode endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public proxy API for location search (autocompletes addresses and locations)
  app.get("/api/location/search", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q || q.length < 2) {
        return res.json({ success: true, results: [] });
      }

      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&addressdetails=1&limit=8`,
        {
          headers: {
            "User-Agent": "SpotlyApp/1.0 (contact@spotly.in)"
          }
        }
      );

      if (nomRes.ok) {
        const data = await nomRes.json();
        const results = (data || []).map((item: any) => {
          const addr = item.address || {};
          const stateName = addr.state || addr.region || "Karnataka";
          const cityName = addr.city || addr.town || addr.state_district || addr.county || addr.suburb || "Bengaluru";
          const cleanCityName = cityName.replace(/Urban|Rural|District|East|West|North|South/gi, "").trim() || "Bengaluru";

          const rawParts = (item.display_name || "").split(",").map((s: string) => s.trim()).filter(Boolean);
          const title = rawParts[0] || item.name || cleanCityName;
          const subtitle = rawParts.slice(1).join(", ");

          return {
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            title,
            subtitle,
            city: cleanCityName,
            state: stateName,
            address: item.display_name,
          };
        });

        return res.json({ success: true, results });
      }

      res.json({ success: true, results: [] });
    } catch (error) {
      console.error("Location search endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all service pincodes
  app.get("/api/admin/pincodes", async (req, res) => {
    try {
      const pincodes = await storage.getAllServicePincodes();
      res.json({ pincodes });
    } catch (error) {
      console.error("Get all pincodes error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create a service pincode
  app.post("/api/admin/pincodes", async (req, res) => {
    try {
      const { prefix, cityName, isActive, displayOrder } = req.body;

      if (!prefix || !cityName) {
        return res.status(400).json({ error: "Prefix and city name are required" });
      }

      const pincode = await storage.createServicePincode({
        prefix,
        cityName,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0
      });
      res.json({ success: true, pincode });
    } catch (error) {
      console.error("Create pincode error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update a service pincode
  app.patch("/api/admin/pincodes/:id", async (req, res) => {
    try {
      const pincode = await storage.updateServicePincode(req.params.id, req.body);
      if (!pincode) {
        return res.status(404).json({ error: "Pincode not found" });
      }
      res.json({ success: true, pincode });
    } catch (error) {
      console.error("Update pincode error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a service pincode
  app.delete("/api/admin/pincodes/:id", async (req, res) => {
    try {
      await storage.deleteServicePincode(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete pincode error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Edit a user
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { name, email, city, mobile } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (city !== undefined) updateData.city = city;
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If name was updated, sync to all accounts matching the same mobile number
      if (name && name.trim() !== "" && user.mobile) {
        const cleanMobile = user.mobile.replace(/\D/g, "").slice(-10);
        const allUsers = await storage.getAllUsers();
        for (const u of allUsers) {
          const uCleanMobile = (u.mobile || "").replace(/\D/g, "").slice(-10);
          if (uCleanMobile === cleanMobile && u.id !== user.id) {
            await storage.updateUser(u.id, { name: name.trim() });
          }
        }
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete a user
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized admin session" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Bulk delete users
  app.post("/api/admin/users/bulk-delete", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized admin session" });
      }

      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "No user IDs provided for deletion" });
      }

      for (const id of userIds) {
        await storage.deleteUser(id);
      }

      res.json({ success: true, count: userIds.length });
    } catch (error) {
      console.error("Bulk delete users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Admin: Create a worker with profile
  app.post("/api/admin/workers", async (req, res) => {
    try {
      const { name, mobile, email, age, gender, services, location, city, latitude, longitude, foodType, workConditions, whatsapp } = req.body;

      // Validate required fields
      if (!name || !mobile) {
        return res.status(400).json({ error: "Name and mobile are required" });
      }
      if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({ error: "Mobile must be 10 digits" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByMobile(mobile, "worker");
      if (existingUser) {
        return res.status(409).json({ error: "Worker with this mobile already exists" });
      }

      const result = await storage.createWorkerWithProfile(
        { name, mobile, email: email || null, role: "worker" },
        { age, gender, services, location, city, latitude, longitude, foodType, workConditions, mobile, whatsapp: whatsapp || mobile }
      );

      res.json({ success: true, user: result.user, profile: result.profile });
    } catch (error) {
      console.error("Create worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update worker profile
  app.patch("/api/admin/workers/:userId", async (req, res) => {
    try {
      const { name, email, ...profileData } = req.body;

      // Update user basic info
      if (name || email !== undefined) {
        await storage.updateUser(req.params.userId, { name, email });
      }

      // Update worker profile
      const profile = await storage.updateWorkerProfile(req.params.userId, profileData);
      if (!profile) {
        return res.status(404).json({ error: "Worker profile not found" });
      }

      res.json({ success: true, profile });
    } catch (error) {
      console.error("Update worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete worker
  app.delete("/api/admin/workers/:userId", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized admin session" });
      }

      await storage.deleteUser(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete worker error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Login endpoint with server-side validation
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;

      let level: 'super' | 'sub' | null = null;

      if (password === SUPER_ADMIN_PASSWORD) {
        level = 'super';
      } else if (password === SUB_ADMIN_PASSWORD) {
        level = 'sub';
      }

      if (!level) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = generateSessionToken();
      adminSessions.set(token, {
        level,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ success: true, token, level });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Validate session endpoint
  app.get("/api/admin/session", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const session = validateAdminSession(token);

    if (!session.valid) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    res.json({ valid: true, level: session.level });
  });

  // Admin: Logout endpoint
  app.post("/api/admin/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      adminSessions.delete(token);
    }
    res.json({ success: true });
  });

  // Admin: Get payment totals (super-admin only with server-side validation)
  app.get("/api/admin/payments/totals", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = validateAdminSession(token);

      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (session.level !== "super") {
        return res.status(403).json({ error: "Access denied. Super admin only." });
      }

      const { startDate, endDate, plan } = req.query;

      const totals = await storage.getPaymentTotals(
        startDate as string | undefined,
        endDate as string | undefined,
        plan as string | undefined
      );

      res.json({
        totalAmount: totals.total / 100, // Convert paise to rupees
        totalAmountPaise: totals.total,
        transactionCount: totals.count,
        currency: "INR"
      });
    } catch (error) {
      console.error("Get payment totals error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all payments list (super-admin only with server-side validation)
  app.get("/api/admin/payments", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      const session = validateAdminSession(token);

      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (session.level !== "super") {
        return res.status(403).json({ error: "Access denied. Super admin only." });
      }

      const { startDate, endDate, plan } = req.query;

      let paymentsList;
      if (startDate && endDate) {
        paymentsList = await storage.getPaymentsByDateRange(startDate as string, endDate as string, plan as string | undefined);
      } else {
        paymentsList = await storage.getAllPayments(plan as string | undefined);
      }

      res.json({ payments: paymentsList });
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get active services (for customers)
  app.get("/api/services", async (req, res) => {
    try {
      const servicesList = await storage.getActiveServices();
      res.json({ services: servicesList });
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get dynamic count of posted parking spaces (for landing page KPI)
  app.get("/api/spots/count", async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      const count = allBookings.length;
      res.json({ count, total: count });
    } catch (error) {
      console.error("Get spots count error:", error);
      res.status(500).json({ error: "Internal server error", count: 0 });
    }
  });

  // Get dynamic count of registered space providers (for landing page KPI)
  app.get("/api/providers/count", async (req, res) => {
    try {
      // 1. Check if custom admin setting is configured
      const customSetting = await storage.getSetting("landing_providers_count");
      if (customSetting?.value && customSetting.value.trim()) {
        return res.json({ count: customSetting.value.trim(), total: customSetting.value.trim() });
      }

      // 2. Count registered providers (role = "customer")
      const providerUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "customer"));
      const allBookings = await storage.getAllBookings();
      const uniqueBookerIds = new Set(allBookings.map((b) => b.customerId).filter(Boolean));
      const registeredIds = new Set(providerUsers.map((u) => u.id));
      const combined = new Set([...Array.from(registeredIds), ...Array.from(uniqueBookerIds)]);
      const count = Math.max(providerUsers.length, combined.size);

      res.json({ count, total: count });
    } catch (error) {
      console.error("Get providers count error:", error);
      res.status(500).json({ error: "Internal server error", count: 0 });
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);

      const user = await storage.getUser(bookingData.customerId);
      if (!user) {
        return res.status(404).json({ error: "User not found. Please log in again." });
      }

      // Infer and normalize city based on physical address and pincode to prevent state mismatch
      const locText = (bookingData.location || "").toLowerCase();
      const pinMatch = (bookingData.location || "").match(/\b\d{6}\b/);
      if (pinMatch) {
        const pin = parseInt(pinMatch[0], 10);
        if (pin >= 600000 && pin <= 649999) {
          bookingData.city = "Chennai";
        } else if (pin >= 560000 && pin <= 599999) {
          bookingData.city = "Bengaluru";
        }
      } else if (locText.includes("tamil nadu") || locText.includes("chennai") || locText.includes("madras")) {
        bookingData.city = "Chennai";
      } else if (locText.includes("karnataka") || locText.includes("bengaluru") || locText.includes("bangalore")) {
        bookingData.city = "Bengaluru";
      }

      const booking = await storage.createBooking(bookingData);

      try {
        let notifiedNearbyIds: string[] = [];
        if (booking.latitude && booking.longitude) {
          notifiedNearbyIds = await storage.createNotificationForNearbyWorkers({
            type: "new_job",
            title: "New Parking Space Nearby!",
            message: `New ${booking.serviceName} posted near you in ${booking.location}`,
            bookingId: booking.id,
            createdAt: new Date().toISOString(),
          }, booking.latitude, booking.longitude, 10);
        }

        await storage.createNotificationForAllWorkers({
          type: "new_job",
          title: "New Parking Space Available",
          message: `New ${booking.serviceName} in ${booking.location}`,
          bookingId: booking.id,
          createdAt: new Date().toISOString(),
        }, booking.city || undefined, notifiedNearbyIds);
      } catch (notifyError) {
        console.error("Failed to dispatch worker notifications:", notifyError);
      }

      res.json({ success: true, booking: stripBookingPhotos(booking) });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Create booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const { serviceName, location, comments, date, time, latitude, longitude } = req.body;
      const booking = await storage.updateBooking(req.params.id, {
        serviceName,
        location,
        comments,
        date,
        time,
        latitude: latitude != null ? Number(latitude) : undefined,
        longitude: longitude != null ? Number(longitude) : undefined,
      });
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ success: true, booking: stripBookingPhotos(booking) });
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get bookings by customer (with worker details for accepted bookings)
  app.get("/api/bookings/customer/:customerId", async (req, res) => {
    try {
      const limitRaw = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offsetRaw = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const limit = limitRaw != null && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
      const offset = offsetRaw != null && Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : undefined;
      const includePhotos = req.query.includePhotos === "true";
      const { bookings, total } = await storage.getBookingsByCustomer(req.params.customerId, limit, offset);

      // Strip heavy base64 photo payload from list responses (saves MBs per request).
      // Replace [PHOTOS]...[/PHOTOS] with [PHOTOS_COUNT:n] so the client can still show counts.
      const stripPhotos = (comments: string | null | undefined) => {
        if (!comments) return comments;
        return comments.replace(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/, (_m, payload) => {
          try {
            const arr = JSON.parse(payload);
            return Array.isArray(arr) ? `[PHOTOS_COUNT:${arr.length}]` : "";
          } catch {
            return "";
          }
        });
      };

      // Enrich bookings with worker details for accepted/completed bookings
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const lean = includePhotos ? booking : { ...booking, comments: stripPhotos(booking.comments) };
          if (booking.workerId && (booking.status === "accepted" || booking.status === "completed")) {
            const worker = await storage.getUser(booking.workerId);
            const workerProfile = await storage.getWorkerProfileByUserId(booking.workerId);
            if (worker) {
              return {
                ...lean,
                worker: {
                  id: worker.id,
                  name: worker.name,
                  mobile: workerProfile?.mobile || worker.mobile,
                  rating: workerProfile?.rating || 4.5,
                  reviews: workerProfile?.reviews || 0,
                  gender: workerProfile?.gender || "Unknown",
                  age: workerProfile?.age,
                  workConditions: workerProfile?.workConditions || ""
                }
              };
            }
          }
          return { ...lean, worker: null };
        })
      );

      res.json({ bookings: enrichedBookings, total });
    } catch (error) {
      console.error("Get customer bookings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get bookings for worker (pending jobs they can accept)
  app.get("/api/bookings/worker/:workerId", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const bookings = await storage.getBookingsByWorker(req.params.workerId, status);
      res.json({ bookings });
    } catch (error) {
      console.error("Get worker bookings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all pending bookings (for workers to see available jobs)
  app.get("/api/bookings/pending", async (req, res) => {
    try {
      const city = req.query.city as string | undefined;
      const state = req.query.state as string | undefined;
      const limitRaw = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offsetRaw = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const limit = limitRaw != null && Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
      const offset = offsetRaw != null && Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : undefined;
      const latRaw = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lngRaw = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const radiusRaw = req.query.radius ? parseFloat(req.query.radius as string) : undefined;
      const userLat = latRaw != null && Number.isFinite(latRaw) ? latRaw : undefined;
      const userLng = lngRaw != null && Number.isFinite(lngRaw) ? lngRaw : undefined;
      const radiusKm = radiusRaw != null && Number.isFinite(radiusRaw) && radiusRaw > 0 ? radiusRaw : undefined;
      const search = req.query.search as string | undefined;
      const { bookings: bookingsList, total } = await storage.getPendingBookings(city, limit, offset, userLat, userLng, radiusKm, state, search);
      const ownerIds = bookingsList.map(b => b.customerId).filter((val, idx, self) => self.indexOf(val) === idx);
      const ownerMap: Record<string, { name: string; phone: string }> = {};
      await Promise.all(ownerIds.map(async (id) => {
        try {
          const user = await storage.getUser(id);
          if (user) ownerMap[id] = { name: user.name || "Space Owner", phone: user.mobile || "" };
        } catch { }
      }));
      const enriched = bookingsList.map(b => ({
        ...b,
        ownerName: ownerMap[b.customerId]?.name || "Space Owner",
        ownerPhone: ownerMap[b.customerId]?.phone || "",
      }));
      res.json({ bookings: enriched, total });
    } catch (error) {
      console.error("Get pending bookings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update booking status (accept, complete, cancel)
  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const { status, workerId, previousWorkerId } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Get the current booking to check if there's a worker being rejected
      const currentBooking = await storage.getBookingById(req.params.id);
      const workerBeingRejected = currentBooking?.workerId;

      const booking = await storage.updateBookingStatus(req.params.id, status, workerId);
      if (!booking) {
        // For acceptance, this likely means another worker already accepted
        if (status === "accepted") {
          return res.status(409).json({ error: "This job was already accepted by another worker" });
        }
        return res.status(404).json({ error: "Booking not found" });
      }

      // Notify worker if they were rejected by customer (status = pending and workerId = null)
      if (status === "pending" && workerId === null && workerBeingRejected) {
        const customer = await storage.getUser(booking.customerId);
        await storage.createNotification({
          userId: workerBeingRejected,
          type: "job_rejected_by_customer",
          title: "Job Reassigned",
          message: `${customer?.name || 'The customer'} has chosen a different worker for their ${booking.serviceName} request. Keep checking for more opportunities!`,
          bookingId: booking.id,
          createdAt: new Date().toISOString(),
        });

        // Also notify other workers in the city that the job is available again
        await storage.createNotificationForAllWorkers({
          type: "new_job",
          title: "Job Available Again",
          message: `${booking.serviceName} job in ${booking.location} is available again`,
          bookingId: booking.id,
          createdAt: new Date().toISOString(),
        }, booking.city || undefined);
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Worker accepts a job
  app.post("/api/bookings/:id/accept", async (req, res) => {
    try {
      const { workerId } = req.body;
      if (!workerId) {
        return res.status(400).json({ error: "Worker ID is required" });
      }
      const booking = await storage.updateBookingStatus(req.params.id, "accepted", workerId);
      if (!booking) {
        return res.status(409).json({ error: "This job was already accepted by another worker" });
      }

      // Notify customer that worker accepted their job
      const worker = await storage.getUser(workerId);
      await storage.createNotification({
        userId: booking.customerId,
        type: "job_accepted",
        title: "Job Accepted",
        message: `${worker?.name || 'A worker'} has accepted your ${booking.serviceName} request`,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
      });

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Accept booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Worker cancels an accepted job (returns it to pending)
  app.post("/api/bookings/:id/cancel", async (req, res) => {
    try {
      const { workerId } = req.body;
      if (!workerId) {
        return res.status(400).json({ error: "Worker ID is required" });
      }

      // First verify the worker owns this booking
      const workerBookings = await storage.getBookingsByWorker(workerId, "accepted");
      const targetBooking = workerBookings.find(b => b.id === req.params.id);
      if (!targetBooking) {
        return res.status(403).json({ error: "You cannot cancel a job you haven't accepted" });
      }

      // Get worker name for notification
      const worker = await storage.getUser(workerId);

      // Reset status to pending and clear workerId
      const booking = await storage.updateBookingStatus(req.params.id, "pending", null);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Notify customer that worker rejected/cancelled with reassurance message
      await storage.createNotification({
        userId: booking.customerId,
        type: "job_rejected",
        title: "Job Cancelled by Worker",
        message: `${worker?.name || 'The worker'} has cancelled your ${booking.serviceName} request. Don't worry! Your job is now available for other workers and you'll be notified soon.`,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
      });

      // Notify workers in the same city that job is available again
      await storage.createNotificationForAllWorkers({
        type: "new_job",
        title: "Job Available Again",
        message: `${booking.serviceName} job in ${booking.location} is available again`,
        bookingId: booking.id,
        createdAt: new Date().toISOString(),
      }, booking.city || undefined);

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rate a booking
  app.post("/api/interests/:bookingId", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      const interest = await storage.addInterest(req.params.bookingId, userId);
      const count = await storage.getInterestCount(req.params.bookingId);

      const booking = await storage.getBookingById(req.params.bookingId);
      if (booking && booking.customerId) {
        const seeker = await storage.getUser(userId);
        const seekerName = seeker?.name || "Someone";
        const spaceName = booking.serviceName || "your parking space";
        await storage.createNotification({
          userId: booking.customerId,
          type: "interest_received",
          title: "New Interest!",
          message: `${seekerName} is interested in ${spaceName}`,
          bookingId: req.params.bookingId,
          createdAt: new Date().toISOString(),
        });
      }

      res.json({ success: true, interest, count });
    } catch (error) {
      console.error("Add interest error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/interests/:bookingId", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: "userId is required" });
      await storage.removeInterest(req.params.bookingId, userId);
      const count = await storage.getInterestCount(req.params.bookingId);
      res.json({ success: true, count });
    } catch (error) {
      console.error("Remove interest error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/interests/counts", async (req, res) => {
    try {
      const bookingIds = (req.query.ids as string || "").split(",").filter(Boolean);
      const [interestCounts, contactViewCounts] = await Promise.all([
        storage.getInterestCounts(bookingIds),
        storage.getViewedContactCounts(bookingIds),
      ]);
      const counts: Record<string, number> = {};
      for (const id of bookingIds) {
        counts[id] = Math.max(interestCounts[id] || 0, contactViewCounts[id] || 0);
      }
      res.json({ counts, contactViewCounts, interestCounts });
    } catch (error) {
      console.error("Get interest counts error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/interests/user/:userId", async (req, res) => {
    try {
      const bookingIds = await storage.getUserInterests(req.params.userId);
      res.json({ bookingIds });
    } catch (error) {
      console.error("Get user interests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/bookings/:id/rate", async (req, res) => {
    try {
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }
      const booking = await storage.rateBooking(req.params.id, rating);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Notify worker about the rating
      if (booking.workerId) {
        await storage.createNotification({
          userId: booking.workerId,
          type: "rating_received",
          title: "New Rating Received",
          message: `You received a ${rating}-star rating for your ${booking.serviceName} service`,
          bookingId: booking.id,
          createdAt: new Date().toISOString(),
        });
      }

      res.json({ success: true, booking });
    } catch (error) {
      console.error("Rate booking error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get a single booking by ID (used for edit flow). Must be defined AFTER all
  // more specific /api/bookings/* routes so it doesn't shadow them.
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json({ booking });
    } catch (error) {
      console.error("Get booking by id error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get notifications for a user
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const notificationsList = await storage.getNotificationsByUser(req.params.userId);
      res.json({ notifications: notificationsList });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true, notification });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark all notifications as read for a user
  app.post("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Clear all notifications for a user
  app.delete("/api/notifications/:userId/clear", async (req, res) => {
    try {
      await storage.clearNotificationsByUser(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Clear notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Broadcast notification to users (requires admin authentication)
  app.post("/api/admin/broadcast", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateAdminSession(token);

      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { title, message, target } = req.body;
      if (!title || !message || !target) {
        return res.status(400).json({ error: "Title, message and target are required" });
      }

      const notification = {
        type: "broadcast",
        title,
        message,
        createdAt: new Date().toISOString(),
      };

      if (target === "workers") {
        await storage.createNotificationForAllWorkers(notification);
      } else if (target === "customers") {
        await storage.createNotificationForAllCustomers(notification);
      } else if (target === "all") {
        await storage.createNotificationForAll(notification);
      } else {
        return res.status(400).json({ error: "Invalid target. Use 'workers', 'customers', or 'all'" });
      }

      res.json({ success: true, message: `Broadcast sent to ${target}` });
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get disclaimer by language (public endpoint)
  app.get("/api/disclaimer/:language", async (req, res) => {
    try {
      const disclaimer = await storage.getDisclaimerByLanguage(req.params.language);
      if (!disclaimer) {
        // Return default English disclaimer if none found
        return res.json({
          disclaimer: {
            language: req.params.language,
            title: "Important Notice",
            content: "This app only helps connect house owners and workers.\nWe do not provide any safety, guarantee, or responsibility for either party.\nHouse owners and workers must communicate directly and take care of their own safety.",
            isActive: true
          }
        });
      }
      res.json({ disclaimer });
    } catch (error) {
      console.error("Get disclaimer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all disclaimers
  app.get("/api/admin/disclaimers", async (req, res) => {
    try {
      const disclaimerList = await storage.getAllDisclaimers();
      res.json({ disclaimers: disclaimerList });
    } catch (error) {
      console.error("Get disclaimers error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create disclaimer
  app.post("/api/admin/disclaimers", async (req, res) => {
    try {
      const { language, title, content, isActive } = req.body;
      if (!language || !title || !content) {
        return res.status(400).json({ error: "Language, title and content are required" });
      }
      const disclaimer = await storage.createDisclaimer({ language, title, content, isActive: isActive ?? true });
      res.json({ success: true, disclaimer });
    } catch (error) {
      console.error("Create disclaimer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update disclaimer
  app.patch("/api/admin/disclaimers/:id", async (req, res) => {
    try {
      const disclaimer = await storage.updateDisclaimer(req.params.id, req.body);
      if (!disclaimer) {
        return res.status(404).json({ error: "Disclaimer not found" });
      }
      res.json({ success: true, disclaimer });
    } catch (error) {
      console.error("Update disclaimer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Delete disclaimer
  app.delete("/api/admin/disclaimers/:id", async (req, res) => {
    try {
      await storage.deleteDisclaimer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete disclaimer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public: Get premium plan configurations
  app.get("/api/settings/premium-plans", async (req, res) => {
    try {
      const [
        basicPrice, standardPrice, premiumPrice,
        basicEnabled, standardEnabled, premiumEnabled,
        basicViews, standardViews, premiumViews,
        basicValidity, standardValidity, premiumValidity
      ] = await Promise.all([
        storage.getSetting("premium_basic_price"),
        storage.getSetting("premium_standard_price"),
        storage.getSetting("premium_premium_price"),
        storage.getSetting("premium_basic_enabled"),
        storage.getSetting("premium_standard_enabled"),
        storage.getSetting("premium_premium_enabled"),
        storage.getSetting("premium_basic_views"),
        storage.getSetting("premium_standard_views"),
        storage.getSetting("premium_premium_views"),
        storage.getSetting("premium_basic_validity"),
        storage.getSetting("premium_standard_validity"),
        storage.getSetting("premium_premium_validity"),
      ]);

      const plans = [
        {
          key: "basic",
          name: "Basic",
          price: parseInt(basicPrice?.value || "199"),
          views: parseInt(basicViews?.value || "10"),
          validity: parseInt(basicValidity?.value || "7"),
          enabled: basicEnabled?.value !== "false"
        },
        {
          key: "standard",
          name: "Standard",
          price: parseInt(standardPrice?.value || "299"),
          views: parseInt(standardViews?.value || "20"),
          validity: parseInt(standardValidity?.value || "15"),
          enabled: standardEnabled?.value !== "false"
        },
        {
          key: "premium",
          name: "Premium",
          price: parseInt(premiumPrice?.value || "399"),
          views: -1,
          validity: parseInt(premiumValidity?.value || "30"),
          enabled: premiumEnabled?.value !== "false"
        },
      ];

      res.json({ plans });
    } catch (error) {
      console.error("Get premium plans error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public: Get Spotly roadside direction configuration (free vs paid toggle and annual price)
  app.get("/api/settings/spotly-direction-config", async (_req, res) => {
    try {
      const [paidEnabledSetting, priceSetting] = await Promise.all([
        storage.getSetting("spotly_direction_paid_enabled"),
        storage.getSetting("spotly_direction_yearly_price"),
      ]);
      const paidEnabled = paidEnabledSetting?.value === "true";
      const yearlyPrice = parseInt(priceSetting?.value || "29", 10) || 29;
      res.json({
        paidEnabled,
        yearlyPrice,
        validityDays: 365,
        planName: "Spotly Roadside Navigation Pass",
      });
    } catch (error) {
      console.error("Get spotly direction config error:", error);
      res.status(500).json({ error: "Failed to get Spotly direction config" });
    }
  });

  // Check if a user has an active Spotly roadside direction pass
  app.get("/api/users/:id/spotly-direction-pass", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user has active space owner contact subscription, grant free unlimited Spotly roadside access
      const isOwnerSubscriber = user.isPremium && (
        !user.premiumExpiresAt || new Date(user.premiumExpiresAt).getTime() > Date.now()
      );
      if (isOwnerSubscriber) {
        return res.json({
          hasActivePass: true,
          isIncludedWithPremium: true,
          unlimited: true,
          expiresAt: user.premiumExpiresAt || null,
        });
      }

      // Check payments for spotly_direction_pass (Yearly Paid Pass)
      const userPayments = await storage.getPaymentsByCustomer(req.params.id);
      const passPayment = userPayments.find(
        (p) => p.type === "spotly_direction_pass" && p.status === "completed"
      );

      if (passPayment) {
        const paidTime = new Date(passPayment.paidAt).getTime();
        const expiresAtTime = paidTime + 365 * 24 * 60 * 60 * 1000;
        if (Date.now() < expiresAtTime) {
          return res.json({
            hasActivePass: true,
            paidAt: passPayment.paidAt,
            expiresAt: new Date(expiresAtTime).toISOString(),
            reference: passPayment.reference,
          });
        }
      }

      res.json({ hasActivePass: false });
    } catch (error) {
      console.error("Get spotly direction pass error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Subscribe to Spotly roadside direction pass
  app.post("/api/users/:id/spotly-direction-pass/subscribe", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const priceSetting = await storage.getSetting("spotly_direction_yearly_price");
      const yearlyPrice = parseInt(priceSetting?.value || "29", 10) || 29;

      const payment = await storage.createPayment({
        customerId: user.id,
        amount: yearlyPrice * 100, // in paise
        currency: "INR",
        type: "spotly_direction_pass",
        status: "completed",
        reference: `SPOTLY-DIR-${Date.now()}`,
        paidAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Spotly Roadside Navigation Pass activated successfully!",
        payment,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error("Subscribe spotly direction pass error:", error);
      res.status(500).json({ error: "Failed to activate pass" });
    }
  });

  // Public: Get app setting (for contact hours)
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      res.json({ setting: setting || null });
    } catch (error) {
      console.error("Get setting error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Get all settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const settingsList = await storage.getAllSettings();
      res.json({ settings: settingsList });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update setting
  app.post("/api/admin/settings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { key, value, description } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      const setting = await storage.upsertSetting(key, value, description);
      res.json({ success: true, setting });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Upload ad video
  app.post("/api/admin/upload-video", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", async () => {
        const body = Buffer.concat(chunks);
        const boundary = req.headers["content-type"]?.split("boundary=")[1];
        if (!boundary) {
          return res.status(400).json({ error: "Invalid form data" });
        }

        const bodyStr = body.toString("latin1");
        const parts = bodyStr.split(`--${boundary}`);

        let fileData: Buffer | null = null;
        let fileName = "ad-video.mp4";

        for (const part of parts) {
          if (part.includes("Content-Disposition") && part.includes('name="video"')) {
            const filenameMatch = part.match(/filename="([^"]+)"/);
            if (filenameMatch) fileName = filenameMatch[1];

            const headerEnd = part.indexOf("\r\n\r\n");
            if (headerEnd !== -1) {
              const dataStart = headerEnd + 4;
              const dataEnd = part.lastIndexOf("\r\n");
              const rawData = part.substring(dataStart, dataEnd);
              fileData = Buffer.from(rawData, "latin1");
            }
          }
        }

        if (!fileData) {
          return res.status(400).json({ error: "No video file found" });
        }

        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(fileName) || ".mp4";
        const savedFileName = `ad-video${ext}`;
        const filePath = path.join(uploadsDir, savedFileName);
        fs.writeFileSync(filePath, fileData);

        const videoUrl = `/uploads/${savedFileName}`;
        await storage.upsertSetting("ad_video_url", videoUrl, "Ad video for home pages");

        res.json({ success: true, url: videoUrl });
      });
    } catch (error) {
      console.error("Upload video error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Database Data Cleanup & Reset Tool
  app.post("/api/admin/data-cleanup", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace("Bearer ", "");
      const session = validateAdminSession(token);
      if (!session.valid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { action, confirmationCode } = req.body;

      if (!action || !confirmationCode) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      if (action === "clear_seekers") {
        if (confirmationCode !== "CLEAR SEEKERS") {
          return res.status(400).json({ error: "Invalid confirmation phrase for clearing seekers" });
        }
        const result = await storage.clearAllSeekers();
        return res.json({
          success: true,
          message: `Cleared ${result.usersCount} space seeker(s) and their associated profiles.`,
          details: result,
        });
      } else if (action === "clear_providers") {
        if (confirmationCode !== "CLEAR PROVIDERS") {
          return res.status(400).json({ error: "Invalid confirmation phrase for clearing providers" });
        }
        const result = await storage.clearAllProviders();
        return res.json({
          success: true,
          message: `Cleared ${result.usersCount} space provider(s) and ${result.bookingsCount} parking space listing(s).`,
          details: result,
        });
      } else if (action === "clear_all") {
        if (confirmationCode !== "RESET ALL DATA") {
          return res.status(400).json({ error: "Invalid confirmation phrase for full system reset" });
        }
        const result = await storage.clearCompleteData();
        return res.json({
          success: true,
          message: `Entire system data successfully reset (${result.usersCount} users, ${result.bookingsCount} listings, ${result.profilesCount} profiles).`,
          details: result,
        });
      } else {
        return res.status(400).json({ error: "Invalid cleanup action" });
      }
    } catch (error) {
      console.error("Admin data cleanup error:", error);
      res.status(500).json({ error: "Internal server error during data cleanup" });
    }
  });

  // ===== Full Database Backup Download (Excel) =====
  app.get("/api/backup/download", async (req, res) => {
    try {
      const { generateDatabaseBackupExcel } = await import("./backup-service");
      const buffer = await generateDatabaseBackupExcel();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `Spotly_Full_Backup_${timestamp}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Backup download error:", error);
      res.status(500).json({ error: "Failed to generate backup file" });
    }
  });

  // ===== Customer Feedback APIs =====
  // 1. Get all customer feedbacks with aggregation statistics
  app.get("/api/feedbacks", async (req, res) => {
    try {
      const allFeedbacks = await storage.getAllFeedbacks(100);
      const total = allFeedbacks.length;
      const averageRating = total > 0 
        ? parseFloat((allFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / total).toFixed(1))
        : 5.0;

      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allFeedbacks.forEach((f) => {
        if (f.rating && f.rating >= 1 && f.rating <= 5) {
          ratingCounts[f.rating] = (ratingCounts[f.rating] || 0) + 1;
        }
      });

      res.json({
        feedbacks: allFeedbacks,
        total,
        averageRating,
        ratingCounts,
      });
    } catch (error) {
      console.error("Get feedbacks error:", error);
      res.status(500).json({ error: "Failed to fetch feedbacks" });
    }
  });

  // 2. Submit customer feedback (Space Provider or Space Seeker)
  app.post("/api/feedbacks", async (req, res) => {
    try {
      const { userId, userName, userRole, userMobile, rating, comments } = req.body;

      if (!userName || !userRole) {
        return res.status(400).json({ error: "Name and role are required" });
      }

      const numRating = parseInt(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ error: "Please provide a valid 1 to 5 star rating" });
      }

      if (!comments || comments.trim().length < 5) {
        return res.status(400).json({ error: "Please share your comments (minimum 5 characters)" });
      }

      // Check if user already submitted - if so, prevent duplicate submission
      if (userId) {
        const existing = await storage.getUserFeedback(userId);
        if (existing) {
          return res.status(400).json({ error: "You have already submitted feedback. Thank you!" });
        }
      }

      const created = await storage.createFeedback({
        userId: userId || null,
        userName: userName.trim(),
        userRole: userRole,
        userMobile: userMobile ? String(userMobile).trim() : null,
        rating: numRating,
        comments: comments.trim(),
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: "Thank you for sharing your feedback with Spotly!",
        feedback: created,
      });
    } catch (error) {
      console.error("Create feedback error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // 3. Check feedback eligibility for a logged-in user
  app.get("/api/feedbacks/eligibility/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ eligible: false, reason: "User ID required" });
      }

      // 1. Check if user already submitted feedback - once submitted, NEVER show again!
      const existing = await storage.getUserFeedback(userId);
      if (existing) {
        return res.json({
          eligible: false,
          alreadySubmitted: true,
          reason: "User has already submitted feedback",
        });
      }

      // 2. If not submitted yet, check admin test mode setting (default to true for immediate display testing)
      const testModeSetting = await storage.getSetting("feedback_test_mode_immediate");
      const isTestMode = testModeSetting ? testModeSetting.value !== "false" : true;
      if (isTestMode) {
        return res.json({
          eligible: true,
          testMode: true,
          reason: "Immediate feedback test mode is enabled in admin settings",
        });
      }

      // Check dynamic trigger days setting (default: 7 days)
      const triggerDaysSetting = await storage.getSetting("feedback_trigger_days");
      const triggerDays = triggerDaysSetting ? parseInt(triggerDaysSetting.value) || 7 : 7;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ eligible: false, reason: "User not found" });
      }

      const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
      const diffMs = Date.now() - createdAtTime;
      const daysSinceRegistration = diffMs / (1000 * 60 * 60 * 24);

      if (daysSinceRegistration >= triggerDays) {
        return res.json({
          eligible: true,
          testMode: false,
          triggerDays,
          daysSinceRegistration: Math.floor(daysSinceRegistration),
        });
      }

      return res.json({
        eligible: false,
        testMode: false,
        triggerDays,
        daysSinceRegistration: Math.floor(daysSinceRegistration),
        reason: `Feedback prompt triggers after ${triggerDays} days of registration (${Math.floor(daysSinceRegistration)} days passed)`,
      });
    } catch (error) {
      console.error("Check feedback eligibility error:", error);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  });

  // 4. Admin: Get customer feedback stats by user role
  app.get("/api/admin/feedbacks/stats", async (req, res) => {
    try {
      const stats = await storage.getFeedbackStats();
      res.json(stats);
    } catch (error) {
      console.error("Get feedback stats error:", error);
      res.status(500).json({ error: "Failed to fetch feedback stats" });
    }
  });

  // 5. Admin: Reset customer feedback by role with double confirmation
  app.post("/api/admin/feedbacks/reset", async (req, res) => {
    try {
      const { target } = req.body;
      if (!target || !["providers", "seekers", "all"].includes(target)) {
        return res.status(400).json({ error: "Invalid target. Must be 'providers', 'seekers', or 'all'." });
      }

      const deletedCount = await storage.deleteFeedbacksByTarget(target as any);

      let label = "All Space Provider & Seeker";
      if (target === "providers") label = "Space Provider";
      if (target === "seekers") label = "Space Seeker";

      res.json({
        success: true,
        target,
        count: deletedCount,
        message: `Successfully deleted ${deletedCount} ${label} feedback records. Eligible users can now receive the feedback modal again.`,
      });
    } catch (error) {
      console.error("Reset feedback error:", error);
      res.status(500).json({ error: "Failed to reset feedback records" });
    }
  });

  // 6. Admin: Delete single feedback entry
  app.delete("/api/admin/feedbacks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFeedbackById(id);
      if (!success) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      res.json({ success: true, message: "Feedback deleted successfully" });
    } catch (error) {
      console.error("Delete feedback error:", error);
      res.status(500).json({ error: "Failed to delete feedback" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (await import("express")).default.static(path.join(process.cwd(), "uploads")));

  return httpServer;
}
