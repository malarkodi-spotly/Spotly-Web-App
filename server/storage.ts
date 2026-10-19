import { type User, type InsertUser, users, type WorkerProfile, type InsertWorkerProfile, workerProfiles, type City, type InsertCity, cities, type Booking, type InsertBooking, bookings, type Notification, type InsertNotification, notifications, type Service, type InsertService, services, type Payment, type InsertPayment, payments, type Disclaimer, type InsertDisclaimer, disclaimers, type AppSetting, type InsertAppSetting, appSettings, type ServicePincode, type InsertServicePincode, servicePincodes, type Interest, type InsertInterest, interests, viewedContacts, feedbacks, type Feedback, type InsertFeedback } from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, sql, ne, or, isNull, inArray, like } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByMobile(mobile: string, role: string): Promise<User | undefined>;
  getUserByMobileAnyRole(mobile: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  updateUserVerification(id: string): Promise<User | undefined>;
  activatePremium(id: string): Promise<User | undefined>;
  activatePremiumWithPlan(id: string, plan: string, views: number): Promise<User | undefined>;
  usePremiumView(id: string): Promise<User | undefined>;
  deactivatePremium(id: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Worker profile methods
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;
  getWorkerProfileByUserId(userId: string): Promise<WorkerProfile | undefined>;
  getAllWorkerProfiles(city?: string): Promise<(WorkerProfile & { name: string })[]>;
  updateWorkerProfile(userId: string, profile: Partial<InsertWorkerProfile>): Promise<WorkerProfile | undefined>;
  
  // City methods
  getAllCities(): Promise<City[]>;
  getActiveCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: string, city: Partial<InsertCity>): Promise<City | undefined>;
  deleteCity(id: string): Promise<void>;
  
  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string, limit?: number, offset?: number): Promise<{ bookings: Booking[]; total: number }>;
  getBookingsByWorker(workerId: string, status?: string): Promise<Booking[]>;
  getPendingBookings(city?: string, limit?: number, offset?: number, userLat?: number, userLng?: number, radiusKm?: number, stateName?: string, search?: string): Promise<{ bookings: Booking[]; total: number }>;
  updateBookingStatus(id: string, status: string, workerId?: string | null): Promise<Booking | undefined>;
  updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<void>;
  rateBooking(id: string, rating: number): Promise<Booking | undefined>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  updateWorkerProfileLocation(userId: string, latitude: number, longitude: number): Promise<void>;
  createNotificationForAllWorkers(notification: Omit<InsertNotification, 'userId'>, city?: string, excludeUserIds?: string[]): Promise<void>;
  createNotificationForNearbyWorkers(notification: Omit<InsertNotification, 'userId'>, lat: number, lng: number, radiusKm?: number): Promise<string[]>;
  createNotificationForAllCustomers(notification: Omit<InsertNotification, 'userId'>): Promise<void>;
  createNotificationForAll(notification: Omit<InsertNotification, 'userId'>): Promise<void>;
  
  // Disclaimer methods
  getAllDisclaimers(): Promise<Disclaimer[]>;
  getDisclaimerByLanguage(language: string): Promise<Disclaimer | undefined>;
  createDisclaimer(disclaimer: InsertDisclaimer): Promise<Disclaimer>;
  updateDisclaimer(id: string, disclaimer: Partial<InsertDisclaimer>): Promise<Disclaimer | undefined>;
  deleteDisclaimer(id: string): Promise<void>;
  
  // App Settings methods
  getAllSettings(): Promise<AppSetting[]>;
  getSetting(key: string): Promise<AppSetting | undefined>;
  upsertSetting(key: string, value: string, description?: string): Promise<AppSetting>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAllFeedbacks(limit?: number): Promise<Feedback[]>;
  getUserFeedback(userId: string): Promise<Feedback | undefined>;
  getFeedbackStats(): Promise<{ total: number; providerCount: number; seekerCount: number }>;
  deleteFeedbacksByTarget(target: "providers" | "seekers" | "all"): Promise<number>;
  deleteFeedbackById(id: string): Promise<boolean>;
  
  // Service Pincode methods
  getAllServicePincodes(): Promise<ServicePincode[]>;
  getActiveServicePincodes(): Promise<ServicePincode[]>;
  createServicePincode(pincode: InsertServicePincode): Promise<ServicePincode>;
  updateServicePincode(id: string, pincode: Partial<InsertServicePincode>): Promise<ServicePincode | undefined>;
  deleteServicePincode(id: string): Promise<void>;

  // Interest methods
  addInterest(bookingId: string, userId: string): Promise<Interest>;
  removeInterest(bookingId: string, userId: string): Promise<void>;
  getInterestCount(bookingId: string): Promise<number>;
  getInterestCounts(bookingIds: string[]): Promise<Record<string, number>>;
  getUserInterests(userId: string): Promise<string[]>;

  // Viewed contacts methods
  addViewedContact(userId: string, bookingId: string): Promise<void>;
  getViewedContacts(userId: string): Promise<string[]>;
  getViewedContactCounts(bookingIds: string[]): Promise<Record<string, number>>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getAllPayments(plan?: string): Promise<Payment[]>;
  getPaymentsByDateRange(startDate: string, endDate: string, plan?: string): Promise<Payment[]>;
  getPaymentTotals(startDate?: string, endDate?: string, plan?: string): Promise<{ total: number; count: number }>;
  getPaymentsByCustomer(customerId: string): Promise<Payment[]>;

  // Admin Data Cleanup & System Reset methods
  clearAllSeekers(): Promise<{ usersCount: number; profilesCount: number }>;
  clearAllProviders(): Promise<{ usersCount: number; bookingsCount: number }>;
  clearCompleteData(): Promise<{ usersCount: number; bookingsCount: number; profilesCount: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    if (!id) return undefined;
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (result[0]) return result[0];
    return this.getUserByMobileAnyRole(id);
  }

  async getUserByMobile(mobile: string, role: string): Promise<User | undefined> {
    const clean = mobile.replace(/\D/g, "").slice(-10);
    if (!clean) return undefined;
    const result = await db
      .select()
      .from(users)
      .where(and(
        or(
          eq(users.mobile, clean),
          eq(users.mobile, `+91${clean}`),
          eq(users.mobile, `91${clean}`),
          like(users.mobile, `%${clean}`)
        ),
        eq(users.role, role)
      ))
      .limit(1);
    return result[0];
  }

  async getUserByMobileAnyRole(mobile: string): Promise<User | undefined> {
    const clean = mobile.replace(/\D/g, "").slice(-10);
    if (!clean) return undefined;
    const result = await db
      .select()
      .from(users)
      .where(or(
        eq(users.mobile, clean),
        eq(users.mobile, `+91${clean}`),
        eq(users.mobile, `91${clean}`),
        like(users.mobile, `%${clean}`)
      ))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userToInsert: Record<string, any> = {
      ...insertUser,
      createdAt: (insertUser as any).createdAt || new Date().toISOString(),
    };
    const result = await db
      .insert(users)
      .values(userToInsert as any)
      .returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    if (!id) return undefined;
    let result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    if (!result || result.length === 0) {
      result = await db
        .update(users)
        .set(data)
        .where(eq(users.mobile, id))
        .returning();
    }
    return result[0];
  }

  async updateUserVerification(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async activatePremium(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isPremium: true, premiumActivatedAt: new Date().toISOString() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deactivatePremium(id: string): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({
        isPremium: false,
        premiumViewsRemaining: 0,
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async activatePremiumWithPlan(id: string, plan: string, views: number): Promise<User | undefined> {
    const expiresAt = new Date();
    let validityDays = 30;
    try {
      const validitySetting = await this.getSetting(`premium_${plan}_validity`);
      if (validitySetting?.value) {
        const parsed = parseInt(validitySetting.value);
        if (!isNaN(parsed) && parsed > 0) {
          validityDays = parsed;
        }
      } else {
        if (plan === "basic") {
          validityDays = 7;
        } else if (plan === "standard") {
          validityDays = 15;
        } else if (plan === "premium") {
          validityDays = 30;
        }
      }
    } catch (e) {
      console.error("Error fetching plan validity setting:", e);
      if (plan === "basic") {
        validityDays = 7;
      } else if (plan === "standard") {
        validityDays = 15;
      } else if (plan === "premium") {
        validityDays = 30;
      }
    }
    expiresAt.setDate(expiresAt.getDate() + validityDays);
    
    let result = await db
      .update(users)
      .set({
        isPremium: true,
        premiumActivatedAt: new Date().toISOString(),
        premiumPlan: plan,
        premiumViewsRemaining: views === -1 ? 9999 : views,
        premiumExpiresAt: expiresAt.toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    if ((!result || result.length === 0) && id) {
      result = await db
        .update(users)
        .set({
          isPremium: true,
          premiumActivatedAt: new Date().toISOString(),
          premiumPlan: plan,
          premiumViewsRemaining: views === -1 ? 9999 : views,
          premiumExpiresAt: expiresAt.toISOString(),
        })
        .where(eq(users.mobile, id))
        .returning();
    }
    return result[0];
  }

  async usePremiumView(id: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    if (user.premiumPlan === "premium") return user;
    const result = await db
      .update(users)
      .set({
        premiumViewsRemaining: sql`GREATEST(${users.premiumViewsRemaining} - 1, 0)`,
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const result = await db
      .insert(workerProfiles)
      .values(profile)
      .returning();
    return result[0];
  }

  async getWorkerProfileByUserId(userId: string): Promise<WorkerProfile | undefined> {
    const result = await db
      .select()
      .from(workerProfiles)
      .where(eq(workerProfiles.userId, userId))
      .limit(1);
    return result[0];
  }

  async getAllWorkerProfiles(city?: string): Promise<(WorkerProfile & { name: string })[]> {
    let query = db
      .select({
        id: workerProfiles.id,
        userId: workerProfiles.userId,
        age: workerProfiles.age,
        gender: workerProfiles.gender,
        services: workerProfiles.services,
        location: workerProfiles.location,
        city: workerProfiles.city,
        latitude: workerProfiles.latitude,
        longitude: workerProfiles.longitude,
        rating: workerProfiles.rating,
        reviews: workerProfiles.reviews,
        mobile: sql<string>`COALESCE(${workerProfiles.mobile}, ${users.mobile})`.as('mobile'),
        whatsapp: sql<string>`COALESCE(${workerProfiles.whatsapp}, ${users.mobile})`.as('whatsapp'),
        foodType: workerProfiles.foodType,
        isFavorite: workerProfiles.isFavorite,
        workConditions: workerProfiles.workConditions,
        availabilityTime: workerProfiles.availabilityTime,
        name: users.name,
      })
      .from(workerProfiles)
      .innerJoin(users, eq(workerProfiles.userId, users.id));
    
    if (city) {
      // Strictly filter by selected city only - workers must have matching city
      query = query.where(eq(workerProfiles.city, city)) as typeof query;
    }
    
    return await query;
  }

  async updateWorkerProfile(userId: string, profile: Partial<InsertWorkerProfile>): Promise<WorkerProfile | undefined> {
    const result = await db
      .update(workerProfiles)
      .set(profile)
      .where(eq(workerProfiles.userId, userId))
      .returning();
    return result[0];
  }

  async getAllCities(): Promise<City[]> {
    const result = await db
      .select()
      .from(cities)
      .orderBy(asc(cities.displayOrder));
    return result;
  }

  async getActiveCities(): Promise<City[]> {
    const result = await db
      .select()
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.displayOrder));
    return result;
  }

  async createCity(city: InsertCity): Promise<City> {
    const result = await db
      .insert(cities)
      .values(city)
      .returning();
    return result[0];
  }

  async updateCity(id: string, city: Partial<InsertCity>): Promise<City | undefined> {
    const result = await db
      .update(cities)
      .set(city)
      .where(eq(cities.id, id))
      .returning();
    return result[0];
  }

  async deleteCity(id: string): Promise<void> {
    await db
      .delete(cities)
      .where(eq(cities.id, id));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return result[0];
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const result = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);
    return result[0];
  }

  async getBookingsByCustomer(customerId: string, limit?: number, offset?: number): Promise<{ bookings: Booking[]; total: number }> {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.customerId, customerId));
    const total = Number(countResult[0]?.count || 0);

    let query = db
      .select()
      .from(bookings)
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.bookedAt));

    if (limit != null) (query as any) = query.limit(limit);
    if (offset != null) (query as any) = query.offset(offset);

    const result = await query;
    return { bookings: result, total };
  }

  async getBookingsByWorker(workerId: string, status?: string): Promise<Booking[]> {
    if (status) {
      const result = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.workerId, workerId), eq(bookings.status, status)))
        .orderBy(desc(bookings.bookedAt));
      return result;
    }
    
    const result = await db
      .select()
      .from(bookings)
      .where(eq(bookings.workerId, workerId))
      .orderBy(desc(bookings.bookedAt));
    return result;
  }

  async getPendingBookings(cityId?: string, limit?: number, offset?: number, userLat?: number, userLng?: number, radiusKm?: number, stateName?: string, search?: string): Promise<{ bookings: Booking[]; total: number }> {
    const conditions: any[] = [eq(bookings.status, "pending"), sql`${bookings.workerId} IS NULL`];

    // Optional search filter
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      conditions.push(
        or(
          sql`lower(${bookings.location}) LIKE '%' || ${s} || '%'`,
          sql`lower(${bookings.serviceName}) LIKE '%' || ${s} || '%'`,
          sql`lower(${bookings.comments}) LIKE '%' || ${s} || '%'`
        )
      );
    }

    // Optional state filter (matched against location text, pincodes, and known cities for the state)
    if (stateName && stateName.trim()) {
      const s = stateName.trim().toLowerCase();
      const isBlrState = s.includes("karnataka");
      const isTnState = s.includes("tamil");
      if (isBlrState) {
        conditions.push(
          and(
            or(
              sql`lower(${bookings.location}) LIKE '%karnataka%'`,
              sql`lower(${bookings.location}) LIKE '%bengaluru%'`,
              sql`lower(${bookings.location}) LIKE '%bangalore%'`,
              sql`lower(${bookings.location}) LIKE '%mysore%'`,
              sql`lower(${bookings.location}) LIKE '%mysuru%'`,
              sql`lower(${bookings.location}) LIKE '%mangalore%'`,
              sql`lower(${bookings.location}) LIKE '%tumakuru%'`,
              sql`lower(${bookings.city}) IN ('bangalore', 'bengaluru', 'bangalore east', 'karnataka')`,
              sql`${bookings.location} ~* '\\m5[6-9][0-9]{4}\\M'`
            ),
            sql`NOT (lower(${bookings.location}) LIKE '%tamil%' OR lower(${bookings.location}) LIKE '%chennai%' OR ${bookings.location} ~* '\\m6[0-4][0-9]{4}\\M')`
          )
        );
      } else if (isTnState) {
        conditions.push(
          and(
            or(
              sql`lower(${bookings.location}) LIKE '%tamil%'`,
              sql`lower(${bookings.location}) LIKE '%chennai%'`,
              sql`lower(${bookings.location}) LIKE '%madras%'`,
              sql`lower(${bookings.location}) LIKE '%coimbatore%'`,
              sql`lower(${bookings.location}) LIKE '%madurai%'`,
              sql`lower(${bookings.city}) IN ('chennai', 'madras', 'tamil nadu', 'coimbatore', 'madurai')`,
              sql`${bookings.location} ~* '\\m6[0-4][0-9]{4}\\M'`
            ),
            sql`NOT (lower(${bookings.location}) LIKE '%karnataka%' OR lower(${bookings.location}) LIKE '%bengaluru%' OR lower(${bookings.location}) LIKE '%bangalore%' OR ${bookings.location} ~* '\\m5[6-9][0-9]{4}\\M')`
          )
        );
      } else {
        conditions.push(sql`lower(${bookings.location}) LIKE '%' || ${s} || '%'`);
      }
    }

    // Optional city filter (only applied when no lat/lng — coordinates take precedence)
    // Bypassed if search is provided to allow cross-city search
    if ((userLat == null || userLng == null) && cityId && (!search || !search.trim())) {
      const cityResult = await db.select().from(cities).where(eq(cities.id, cityId)).limit(1);
      const cityName = cityResult[0]?.name;
      if (cityName) {
        const lowerCityName = cityName.toLowerCase();
        const isBlr = lowerCityName === 'bangalore' || lowerCityName === 'bengaluru';
        conditions.push(
          or(
            sql`lower(${bookings.city}) = ${lowerCityName}`,
            isBlr ? sql`lower(${bookings.city}) IN ('bangalore', 'bengaluru')` : sql`false`,
            sql`${bookings.city} IS NULL`,
            sql`lower(${bookings.location}) LIKE '%' || ${lowerCityName} || '%'`,
            isBlr ? sql`lower(${bookings.location}) LIKE '%bengaluru%' OR lower(${bookings.location}) LIKE '%bangalore%'` : sql`false`
          )
        );
      }
    }

    const whereCondition = and(...conditions);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(whereCondition);
    const total = Number(countResult[0]?.count || 0);

    // Order: when user coords given → sort by distance ASC (nearest first, farthest last,
    // listings without coordinates pushed to the end). Otherwise newest-first.
    const orderClause = (userLat != null && userLng != null)
      ? sql`CASE WHEN ${bookings.latitude} IS NULL OR ${bookings.longitude} IS NULL THEN 1 ELSE 0 END ASC,
             (6371 * acos(
                cos(radians(${userLat})) * cos(radians(${bookings.latitude}))
                * cos(radians(${bookings.longitude}) - radians(${userLng}))
                + sin(radians(${userLat})) * sin(radians(${bookings.latitude}))
             )) ASC NULLS LAST,
             ${bookings.bookedAt} DESC`
      : desc(bookings.bookedAt);

    let query = db
      .select()
      .from(bookings)
      .where(whereCondition)
      .orderBy(orderClause as any);

    if (limit != null) (query as any) = query.limit(limit);
    if (offset != null) (query as any) = query.offset(offset);

    const result = await query;
    return { bookings: result, total };
  }

  async updateBookingStatus(id: string, status: string, workerId?: string | null): Promise<Booking | undefined> {
    const updateData: Partial<Booking> = { status };
    // Handle workerId - if explicitly passed (even as null), update it
    if (workerId !== undefined) {
      updateData.workerId = workerId;
    }
    
    // For accepting a job, only allow if booking is still pending (prevents double acceptance)
    if (status === "accepted" && workerId) {
      const result = await db
        .update(bookings)
        .set(updateData)
        .where(and(eq(bookings.id, id), eq(bookings.status, "pending")))
        .returning();
      return result[0]; // Returns undefined if booking was already accepted
    }
    
    const result = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined> {
    const result = await db
      .update(bookings)
      .set(data)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async deleteBooking(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(interests).where(eq(interests.bookingId, id));
      await tx.delete(viewedContacts).where(eq(viewedContacts.bookingId, id));
      await tx.delete(notifications).where(eq(notifications.bookingId, id));
      await tx.delete(bookings).where(eq(bookings.id, id));
    });
  }

  async rateBooking(id: string, rating: number): Promise<Booking | undefined> {
    const result = await db
      .update(bookings)
      .set({ rating, ratedAt: new Date().toISOString() })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    return result;
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async updateWorkerProfileLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    await db
      .update(workerProfiles)
      .set({ latitude, longitude })
      .where(eq(workerProfiles.userId, userId));
  }

  async createNotificationForAllWorkers(notification: Omit<InsertNotification, 'userId'>, city?: string, excludeUserIds?: string[]): Promise<void> {
    let workerIds: { id: string }[];
    
    if (city) {
      const workersInCity = await db
        .select({ userId: workerProfiles.userId })
        .from(workerProfiles)
        .innerJoin(users, eq(users.id, workerProfiles.userId))
        .where(eq(workerProfiles.city, city));
      
      workerIds = workersInCity.map(w => ({ id: w.userId }));
    } else {
      workerIds = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "worker"));
    }
    
    const excludeSet = new Set(excludeUserIds || []);
    const valuesToInsert = workerIds
      .filter(w => !excludeSet.has(w.id))
      .map(w => ({ ...notification, userId: w.id }));
    
    if (valuesToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        await db.insert(notifications).values(valuesToInsert.slice(i, i + batchSize));
      }
    }
  }

  async createNotificationForNearbyWorkers(notification: Omit<InsertNotification, 'userId'>, lat: number, lng: number, radiusKm: number = 10): Promise<string[]> {
    const allProfiles = await db
      .select({ userId: workerProfiles.userId, latitude: workerProfiles.latitude, longitude: workerProfiles.longitude })
      .from(workerProfiles)
      .innerJoin(users, eq(users.id, workerProfiles.userId));

    const toRad = (deg: number) => deg * Math.PI / 180;
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const nearbyWorkerIds = allProfiles
      .filter(p => p.latitude && p.longitude && haversine(lat, lng, p.latitude, p.longitude) <= radiusKm)
      .map(p => p.userId);

    if (nearbyWorkerIds.length > 0) {
      const valuesToInsert = nearbyWorkerIds.map(id => ({ ...notification, userId: id }));
      const batchSize = 100;
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        await db.insert(notifications).values(valuesToInsert.slice(i, i + batchSize));
      }
    }
    return nearbyWorkerIds;
  }

  async createNotificationForAllCustomers(notification: Omit<InsertNotification, 'userId'>): Promise<void> {
    const customers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "customer"));
    
    if (customers.length > 0) {
      const valuesToInsert = customers.map(c => ({ ...notification, userId: c.id }));
      const batchSize = 100;
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        await db.insert(notifications).values(valuesToInsert.slice(i, i + batchSize));
      }
    }
  }

  async createNotificationForAll(notification: Omit<InsertNotification, 'userId'>): Promise<void> {
    const allUsers = await db
      .select({ id: users.id })
      .from(users);
    
    if (allUsers.length > 0) {
      const valuesToInsert = allUsers.map(u => ({ ...notification, userId: u.id }));
      const batchSize = 100;
      for (let i = 0; i < valuesToInsert.length; i += batchSize) {
        await db.insert(notifications).values(valuesToInsert.slice(i, i + batchSize));
      }
    }
  }

  async clearNotificationsByUser(userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db
      .select()
      .from(users);
    return result;
  }

  async getAllBookings(): Promise<Booking[]> {
    const result = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.bookedAt));
    return result;
  }

  // Service methods
  async getAllServices(): Promise<Service[]> {
    const result = await db
      .select()
      .from(services)
      .orderBy(asc(services.displayOrder));
    return result;
  }

  async getActiveServices(): Promise<Service[]> {
    const result = await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.displayOrder));
    return result;
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db
      .insert(services)
      .values(service)
      .returning();
    return result[0];
  }

  async updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db
      .update(services)
      .set(service)
      .where(eq(services.id, id))
      .returning();
    return result[0];
  }

  async deleteService(id: string): Promise<void> {
    await db
      .delete(services)
      .where(eq(services.id, id));
  }

  // Callback to invalidate in-memory user sessions (injected by routes layer)
  private _invalidateUserSessions: ((userId: string) => void) | null = null;

  setSessionInvalidator(fn: (userId: string) => void) {
    this._invalidateUserSessions = fn;
  }

  // Admin: Delete user and related data
  async deleteUser(id: string): Promise<void> {
    // Get the user's mobile before deletion so we can clean up sessions by mobile too
    const userRecord = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const userMobile = userRecord[0]?.mobile;

    // Get this user's bookings first so we can clean up child records that reference them
    const userBookings = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.customerId, id));
    const bookingIds = userBookings.map(b => b.id);

    // Delete all related data first (foreign key constraints)
    await db.delete(workerProfiles).where(eq(workerProfiles.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    // Delete interests created by this user
    await db.delete(interests).where(eq(interests.userId, id));
    // Delete viewedContacts created by this user
    await db.delete(viewedContacts).where(eq(viewedContacts.userId, id));
    // Delete interests + viewedContacts + notifications pointing to this user's bookings (if any)
    if (bookingIds.length > 0) {
      await db.delete(interests).where(inArray(interests.bookingId, bookingIds));
      await db.delete(viewedContacts).where(inArray(viewedContacts.bookingId, bookingIds));
      await db.delete(notifications).where(inArray(notifications.bookingId, bookingIds));
    }

    // Revert worker bookings back to pending (do not delete customer bookings)
    await db
      .update(bookings)
      .set({ workerId: null, status: "pending" })
      .where(eq(bookings.workerId, id));

    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));

    // Invalidate any active in-memory sessions for this user
    if (this._invalidateUserSessions) {
      this._invalidateUserSessions(id);
    }
  }

  // Admin: Create worker with profile
  async createWorkerWithProfile(userData: InsertUser, profileData: Partial<InsertWorkerProfile>): Promise<{ user: User; profile: WorkerProfile }> {
    const user = await db
      .insert(users)
      .values({ ...userData, role: "worker", isVerified: true })
      .returning();
    
    const profile = await db
      .insert(workerProfiles)
      .values({ ...profileData, userId: user[0].id })
      .returning();
    
    return { user: user[0], profile: profile[0] };
  }

  // Admin: Delete worker profile
  async deleteWorkerProfile(userId: string): Promise<void> {
    await db.delete(workerProfiles).where(eq(workerProfiles.userId, userId));
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db
      .insert(payments)
      .values(payment)
      .returning();
    return result[0];
  }

  async getPaymentsByCustomer(customerId: string): Promise<Payment[]> {
    let user = await this.getUser(customerId);
    if (!user) {
      user = await this.getUserByMobileAnyRole(customerId);
    }
    const targetId = user ? user.id : customerId;
    const result = await db
      .select()
      .from(payments)
      .where(or(eq(payments.customerId, targetId), eq(payments.customerId, customerId)))
      .orderBy(desc(payments.paidAt));
    return result;
  }

  async getAllPayments(plan?: string): Promise<Payment[]> {
    const conditions: any[] = [];
    if (plan) {
      const planUpper = plan.toUpperCase();
      if (planUpper === "STANDARD") {
        conditions.push(or(
          sql`${payments.reference} LIKE ${'PREM-STANDARD%'}`,
          sql`${payments.reference} LIKE ${'PREM-STD%'}`
        ));
      } else {
        conditions.push(sql`${payments.reference} LIKE ${`PREM-${planUpper}%`}`);
      }
    }
    const result = await db
      .select()
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.paidAt));
    return result;
  }

  async getPaymentsByDateRange(startDate: string, endDate: string, plan?: string): Promise<Payment[]> {
    const conditions: any[] = [
      sql`${payments.paidAt} >= ${startDate}`,
      sql`${payments.paidAt} <= ${endDate}`
    ];
    if (plan) {
      const planUpper = plan.toUpperCase();
      if (planUpper === "STANDARD") {
        conditions.push(or(
          sql`${payments.reference} LIKE ${'PREM-STANDARD%'}`,
          sql`${payments.reference} LIKE ${'PREM-STD%'}`
        ));
      } else {
        conditions.push(sql`${payments.reference} LIKE ${`PREM-${planUpper}%`}`);
      }
    }
    const result = await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.paidAt));
    return result;
  }

  async getPaymentTotals(startDate?: string, endDate?: string, plan?: string): Promise<{ total: number; count: number }> {
    const conditions: any[] = [eq(payments.status, "completed")];

    if (startDate && endDate) {
      conditions.push(sql`${payments.paidAt} >= ${startDate}`);
      conditions.push(sql`${payments.paidAt} <= ${endDate}`);
    }

    if (plan) {
      const planUpper = plan.toUpperCase();
      if (planUpper === "STANDARD") {
        conditions.push(or(
          sql`${payments.reference} LIKE ${'PREM-STANDARD%'}`,
          sql`${payments.reference} LIKE ${'PREM-STD%'}`
        ));
      } else {
        conditions.push(sql`${payments.reference} LIKE ${`PREM-${planUpper}%`}`);
      }
    }

    const query = db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(payments)
      .where(and(...conditions));

    const result = await query;
    return {
      total: Number(result[0]?.total || 0),
      count: Number(result[0]?.count || 0)
    };
  }

  async getAllDisclaimers(): Promise<Disclaimer[]> {
    const result = await db
      .select()
      .from(disclaimers)
      .orderBy(asc(disclaimers.language));
    return result;
  }

  async getDisclaimerByLanguage(language: string): Promise<Disclaimer | undefined> {
    const result = await db
      .select()
      .from(disclaimers)
      .where(and(eq(disclaimers.language, language), eq(disclaimers.isActive, true)))
      .limit(1);
    return result[0];
  }

  async createDisclaimer(disclaimer: InsertDisclaimer): Promise<Disclaimer> {
    const result = await db
      .insert(disclaimers)
      .values({ ...disclaimer, updatedAt: new Date().toISOString() })
      .returning();
    return result[0];
  }

  async updateDisclaimer(id: string, disclaimer: Partial<InsertDisclaimer>): Promise<Disclaimer | undefined> {
    const result = await db
      .update(disclaimers)
      .set({ ...disclaimer, updatedAt: new Date().toISOString() })
      .where(eq(disclaimers.id, id))
      .returning();
    return result[0];
  }

  async deleteDisclaimer(id: string): Promise<void> {
    await db.delete(disclaimers).where(eq(disclaimers.id, id));
  }

  async getAllSettings(): Promise<AppSetting[]> {
    const result = await db
      .select()
      .from(appSettings)
      .orderBy(asc(appSettings.key));
    return result;
  }

  async getSetting(key: string): Promise<AppSetting | undefined> {
    const result = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);
    return result[0];
  }

  async upsertSetting(key: string, value: string, description?: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const result = await db
        .update(appSettings)
        .set({ value, description, updatedAt: new Date().toISOString() })
        .where(eq(appSettings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db
        .insert(appSettings)
        .values({ key, value, description, updatedAt: new Date().toISOString() })
        .returning();
      return result[0];
    }
  }

  async getAllServicePincodes(): Promise<ServicePincode[]> {
    const result = await db
      .select()
      .from(servicePincodes)
      .orderBy(asc(servicePincodes.displayOrder));
    return result;
  }

  async getActiveServicePincodes(): Promise<ServicePincode[]> {
    const result = await db
      .select()
      .from(servicePincodes)
      .where(eq(servicePincodes.isActive, true))
      .orderBy(asc(servicePincodes.displayOrder));
    return result;
  }

  async createServicePincode(pincode: InsertServicePincode): Promise<ServicePincode> {
    const result = await db
      .insert(servicePincodes)
      .values(pincode)
      .returning();
    return result[0];
  }

  async updateServicePincode(id: string, pincode: Partial<InsertServicePincode>): Promise<ServicePincode | undefined> {
    const result = await db
      .update(servicePincodes)
      .set(pincode)
      .where(eq(servicePincodes.id, id))
      .returning();
    return result[0];
  }

  async deleteServicePincode(id: string): Promise<void> {
    await db.delete(servicePincodes).where(eq(servicePincodes.id, id));
  }

  async addInterest(bookingId: string, userId: string): Promise<Interest> {
    const result = await db
      .insert(interests)
      .values({ bookingId, userId })
      .onConflictDoNothing()
      .returning();
    if (result[0]) return result[0];
    const existing = await db
      .select()
      .from(interests)
      .where(and(eq(interests.bookingId, bookingId), eq(interests.userId, userId)))
      .limit(1);
    return existing[0];
  }

  async removeInterest(bookingId: string, userId: string): Promise<void> {
    await db
      .delete(interests)
      .where(and(eq(interests.bookingId, bookingId), eq(interests.userId, userId)));
  }

  async getInterestCount(bookingId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interests)
      .where(eq(interests.bookingId, bookingId));
    return result[0]?.count || 0;
  }

  async getInterestCounts(bookingIds: string[]): Promise<Record<string, number>> {
    if (bookingIds.length === 0) return {};
    const result = await db
      .select({
        bookingId: interests.bookingId,
        count: sql<number>`count(*)::int`,
      })
      .from(interests)
      .where(sql`${interests.bookingId} IN (${sql.join(bookingIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(interests.bookingId);
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.bookingId] = row.count;
    }
    return counts;
  }

  async getUserInterests(userId: string): Promise<string[]> {
    const result = await db
      .select({ bookingId: interests.bookingId })
      .from(interests)
      .where(eq(interests.userId, userId));
    return result.map(r => r.bookingId);
  }

  async addViewedContact(userId: string, bookingId: string): Promise<void> {
    await db
      .insert(viewedContacts)
      .values({ userId, bookingId })
      .onConflictDoNothing();
  }

  async getViewedContacts(userId: string): Promise<string[]> {
    const result = await db
      .select({ bookingId: viewedContacts.bookingId })
      .from(viewedContacts)
      .where(eq(viewedContacts.userId, userId));
    return result.map(r => r.bookingId);
  }

  async getViewedContactCounts(bookingIds: string[]): Promise<Record<string, number>> {
    if (bookingIds.length === 0) return {};
    const result = await db
      .select({
        bookingId: viewedContacts.bookingId,
        count: sql<number>`count(*)::int`,
      })
      .from(viewedContacts)
      .where(sql`${viewedContacts.bookingId} IN (${sql.join(bookingIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(viewedContacts.bookingId);
    const counts: Record<string, number> = {};
    for (const row of result) {
      counts[row.bookingId] = row.count;
    }
    return counts;
  }

  // Admin Data Cleanup Methods
  async clearAllSeekers(): Promise<{ usersCount: number; profilesCount: number }> {
    const seekerUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "worker"));
    const seekerIds = seekerUsers.map(u => u.id);
    
    if (seekerIds.length === 0) {
      return { usersCount: 0, profilesCount: 0 };
    }

    // 1. Delete interests expressed by seekers
    await db.delete(interests).where(inArray(interests.userId, seekerIds));

    // 2. Delete viewedContacts created by seekers
    await db.delete(viewedContacts).where(inArray(viewedContacts.userId, seekerIds));

    // 3. Delete notifications for seekers
    await db.delete(notifications).where(inArray(notifications.userId, seekerIds));

    // 4. Revert any bookings assigned to seekers
    await db
      .update(bookings)
      .set({ workerId: null, status: "pending" })
      .where(inArray(bookings.workerId, seekerIds));

    // 5. Delete worker profiles
    await db.delete(workerProfiles).where(inArray(workerProfiles.userId, seekerIds));

    // 6. Delete seeker users
    await db.delete(users).where(inArray(users.id, seekerIds));

    return {
      usersCount: seekerIds.length,
      profilesCount: seekerIds.length,
    };
  }

  async clearAllProviders(): Promise<{ usersCount: number; bookingsCount: number }> {
    const providerUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, "customer"));
    const providerIds = providerUsers.map(u => u.id);

    if (providerIds.length === 0) {
      return { usersCount: 0, bookingsCount: 0 };
    }

    // 1. Get all bookings created by providers
    const providerBookings = await db.select({ id: bookings.id }).from(bookings).where(inArray(bookings.customerId, providerIds));
    const bookingIds = providerBookings.map(b => b.id);

    // 2. Delete related interests, viewedContacts, notifications for these bookings
    if (bookingIds.length > 0) {
      await db.delete(interests).where(inArray(interests.bookingId, bookingIds));
      await db.delete(viewedContacts).where(inArray(viewedContacts.bookingId, bookingIds));
      await db.delete(notifications).where(inArray(notifications.bookingId, bookingIds));
      await db.delete(bookings).where(inArray(bookings.id, bookingIds));
    }

    // 3. Delete notifications sent to providers
    await db.delete(notifications).where(inArray(notifications.userId, providerIds));

    // 4. Delete payments from providers
    await db.delete(payments).where(inArray(payments.customerId, providerIds));

    // 5. Delete provider users
    await db.delete(users).where(inArray(users.id, providerIds));

    return {
      usersCount: providerIds.length,
      bookingsCount: bookingIds.length,
    };
  }

  async clearCompleteData(): Promise<{ usersCount: number; bookingsCount: number; profilesCount: number }> {
    const allUsers = await db.select({ id: users.id }).from(users);
    const allBookings = await db.select({ id: bookings.id }).from(bookings);
    const allProfiles = await db.select({ id: workerProfiles.id }).from(workerProfiles);

    // 1. Delete child tables
    await db.delete(interests);
    await db.delete(viewedContacts);
    await db.delete(notifications);
    await db.delete(payments);

    // 2. Delete bookings & worker profiles
    await db.delete(bookings);
    await db.delete(workerProfiles);

    // 3. Delete all users (both customers and workers)
    await db.delete(users);

    return {
      usersCount: allUsers.length,
      bookingsCount: allBookings.length,
      profilesCount: allProfiles.length,
    };
  }

  // Feedback implementations
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const result = await db
      .insert(feedbacks)
      .values(feedback)
      .returning();
    return result[0];
  }

  async getAllFeedbacks(limit: number = 100): Promise<Feedback[]> {
    const result = await db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.isActive, true))
      .orderBy(desc(feedbacks.createdAt))
      .limit(limit);
    return result;
  }

  async getUserFeedback(userId: string): Promise<Feedback | undefined> {
    const cleanMobile = userId.replace(/\D/g, "").slice(-10);
    const conditions = [eq(feedbacks.userId, userId)];
    if (cleanMobile.length === 10) {
      conditions.push(eq(feedbacks.userMobile, cleanMobile));
      conditions.push(like(feedbacks.userMobile, `%${cleanMobile}%`));
    }
    const result = await db
      .select()
      .from(feedbacks)
      .where(or(...conditions))
      .limit(1);
    return result[0];
  }

  async getFeedbackStats(): Promise<{ total: number; providerCount: number; seekerCount: number }> {
    const all = await db.select().from(feedbacks);
    let providerCount = 0;
    let seekerCount = 0;
    all.forEach((f) => {
      if (f.userRole === "customer" || f.userRole === "space-provider") {
        providerCount++;
      } else {
        seekerCount++;
      }
    });
    return {
      total: all.length,
      providerCount,
      seekerCount,
    };
  }

  async deleteFeedbacksByTarget(target: "providers" | "seekers" | "all"): Promise<number> {
    let deleted: any[] = [];
    if (target === "providers") {
      deleted = await db
        .delete(feedbacks)
        .where(or(eq(feedbacks.userRole, "customer"), eq(feedbacks.userRole, "space-provider")))
        .returning();
    } else if (target === "seekers") {
      deleted = await db
        .delete(feedbacks)
        .where(or(eq(feedbacks.userRole, "worker"), eq(feedbacks.userRole, "space-seeker")))
        .returning();
    } else if (target === "all") {
      deleted = await db.delete(feedbacks).returning();
    }
    return deleted.length;
  }

  async deleteFeedbackById(id: string): Promise<boolean> {
    const deleted = await db.delete(feedbacks).where(eq(feedbacks.id, id)).returning();
    return deleted.length > 0;
  }
}

export const storage = new DatabaseStorage();
