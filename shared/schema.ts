import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, real, integer, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  email: text("email"),
  mobile: varchar("mobile", { length: 10 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'customer' or 'worker'
  isVerified: boolean("is_verified").default(false),
  isPremium: boolean("is_premium").default(false), // Premium membership status for customers
  premiumActivatedAt: text("premium_activated_at"), // When premium was activated
  premiumPlan: varchar("premium_plan", { length: 30 }), // 'basic', 'standard', 'premium'
  premiumViewsRemaining: integer("premium_views_remaining").default(0),
  premiumExpiresAt: text("premium_expires_at"),
  city: varchar("city", { length: 100 }), // City for filtering customers
  lastKnownLocation: jsonb("last_known_location").$type<{
    lat: number;
    lng: number;
    state: string;
    city: string;
  }>(),
  createdAt: text("created_at").default(sql`now()`), // When user was created
}, (table) => [
  uniqueIndex("mobile_role_idx").on(table.mobile, table.role),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  mobile: true,
  role: true,
  city: true,
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  role: z.enum(["customer", "worker"]),
});

export const loginSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  role: z.enum(["customer", "worker"]),
});

export const otpVerificationSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  otp: z.string().length(4, "OTP must be 4 digits"),
  role: z.enum(["customer", "worker"]),
  name: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).or(z.null()).optional(),
  city: z.string().optional().nullable(),
  lastKnownLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    state: z.string(),
    city: z.string(),
  }).optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;

// Worker Profiles Table
export const workerProfiles = pgTable("worker_profiles", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  userId: varchar("user_id").notNull().references(() => users.id),
  age: integer("age"),
  gender: varchar("gender", { length: 10 }), // 'Male' or 'Female'
  services: text("services").array(), // Array of service names
  location: text("location"), // Display address
  city: varchar("city", { length: 100 }), // City for filtering
  latitude: real("latitude"),
  longitude: real("longitude"),
  rating: real("rating").default(4.5),
  reviews: integer("reviews").default(0),
  mobile: varchar("mobile", { length: 15 }),
  whatsapp: varchar("whatsapp", { length: 15 }),
  foodType: varchar("food_type", { length: 10 }), // 'veg' or 'nonveg'
  isFavorite: boolean("is_favorite").default(false),
  workConditions: text("work_conditions"), // Worker's conditions, rules, and availability
  availabilityTime: varchar("availability_time", { length: 20 }).default("anytime"), // 'anytime' or '6am-6pm'
});

export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({
  id: true,
  rating: true,
  reviews: true,
  isFavorite: true,
});

export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;
export type WorkerProfile = typeof workerProfiles.$inferSelect;

// Cities Table (Admin-managed)
export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  state: text("state").default(""),
  latitude: real("latitude").default(0),
  longitude: real("longitude").default(0),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
});

export type InsertCity = z.infer<typeof insertCitySchema>;
export type City = typeof cities.$inferSelect;

// Services Table (Admin-managed)
export const services = pgTable("services", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// Bookings Table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  workerId: varchar("worker_id").references(() => users.id),
  serviceId: varchar("service_id", { length: 50 }).notNull(),
  serviceName: text("service_name").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  latitude: real("latitude"), // Job location coordinates
  longitude: real("longitude"),
  city: varchar("city", { length: 100 }), // City for filtering
  comments: text("comments"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, completed, cancelled
  rating: integer("rating"),
  ratedAt: text("rated_at"),
  bookedAt: text("booked_at").notNull(),
  scheduledAt: text("scheduled_at"),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  rating: true,
  ratedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Notifications Table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'new_job', 'job_accepted', 'job_rejected', 'rating_received'
  title: text("title").notNull(),
  message: text("message").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  isRead: boolean("is_read").default(false),
  createdAt: text("created_at").notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Payments Table (tracks all payments including premium membership)
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // Amount in paise (₹299 = 29900)
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  type: varchar("type", { length: 50 }).notNull(), // 'premium_membership', 'booking_payment', etc.
  status: varchar("status", { length: 20 }).notNull().default("completed"), // pending, completed, failed, refunded
  reference: text("reference"), // Payment reference/transaction ID
  paidAt: text("paid_at").notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Disclaimer Table (Admin-managed multilingual disclaimers)
export const disclaimers = pgTable("disclaimers", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  language: varchar("language", { length: 20 }).notNull(), // 'english', 'tamil', 'kannada', 'telugu', 'hindi'
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  updatedAt: text("updated_at"),
});

export const insertDisclaimerSchema = createInsertSchema(disclaimers).omit({
  id: true,
});

export type InsertDisclaimer = z.infer<typeof insertDisclaimerSchema>;
export type Disclaimer = typeof disclaimers.$inferSelect;

// Service Pincodes Table (Admin-managed valid pincode prefixes)
export const servicePincodes = pgTable("service_pincodes", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  prefix: varchar("prefix", { length: 10 }).notNull(),
  cityName: text("city_name").notNull(), // Display name like "Bangalore", "Chennai"
  cityId: varchar("city_id"), // Reference to cities table for deterministic mapping
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
});

export const insertServicePincodeSchema = createInsertSchema(servicePincodes).omit({
  id: true,
});

export type InsertServicePincode = z.infer<typeof insertServicePincodeSchema>;
export type ServicePincode = typeof servicePincodes.$inferSelect;

// Interests Table (Space Seekers expressing interest in parking spaces)
export const interests = pgTable("interests", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  bookingId: varchar("booking_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: text("created_at").default(sql`now()`),
}, (table) => [
  uniqueIndex("booking_user_interest_idx").on(table.bookingId, table.userId),
]);

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
  createdAt: true,
});

export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Interest = typeof interests.$inferSelect;

// Viewed Contacts Table (tracks which Space Seekers viewed which Space Provider contacts)
export const viewedContacts = pgTable("viewed_contacts", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  viewedAt: text("viewed_at").default(sql`now()`),
}, (table) => [
  uniqueIndex("user_booking_viewed_idx").on(table.userId, table.bookingId),
]);

export const insertViewedContactSchema = createInsertSchema(viewedContacts).omit({
  id: true,
  viewedAt: true,
});

export type InsertViewedContact = z.infer<typeof insertViewedContactSchema>;
export type ViewedContact = typeof viewedContacts.$inferSelect;

// App Settings Table (Admin-managed settings like contact hours)
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: text("updated_at"),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
});

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;

// Customer Feedback Table (Feedback from both Space Providers and Space Seekers)
export const feedbacks = pgTable("feedbacks", {
  id: varchar("id").primaryKey().$defaultFn(() => generateUUID()),
  userId: varchar("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  userRole: varchar("user_role", { length: 50 }).notNull(), // 'customer' | 'worker' | 'space-provider' | 'space-seeker'
  userMobile: varchar("user_mobile", { length: 20 }),
  rating: integer("rating").notNull(), // 1 to 5
  comments: text("comments").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  createdAt: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbacks.$inferSelect;

