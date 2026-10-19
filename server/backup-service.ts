import XLSX from "xlsx";
import { db } from "./db";
import { users, workerProfiles, bookings, interests, viewedContacts, payments, cities, services } from "@shared/schema";
import { desc, eq, inArray } from "drizzle-orm";

interface ParsedComment {
  rent: string;
  description: string;
  photos: string[];
}

function parseBookingComments(comments: string | null): ParsedComment {
  if (!comments) return { rent: "N/A", description: "None", photos: [] };
  let rent = "N/A";
  let description = comments;
  let photos: string[] = [];

  const rentMatch = comments.match(/Rent:\s*₹([\d,]+)\/month/i);
  if (rentMatch) {
    rent = `₹${rentMatch[1]}/month`;
  }

  const descMatch = comments.match(/Description:\s*([\s\S]*?)(?=(?:\s*Photos:|$))/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  const photosMatch = comments.match(/Photos:\s*([\s\S]*)/i);
  if (photosMatch) {
    try {
      const parsed = JSON.parse(photosMatch[1].trim());
      if (Array.isArray(parsed)) {
        photos = parsed;
      }
    } catch {
      photos = [];
    }
  }

  return { rent, description, photos };
}

export async function getDatabaseBackupData() {
  const [
    allUsers,
    allProfiles,
    allBookings,
    allInterests,
    allViewedContacts,
    allPayments,
    allCities,
    allServices,
  ] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    db.select().from(workerProfiles),
    db.select().from(bookings).orderBy(desc(bookings.bookedAt)),
    db.select().from(interests).orderBy(desc(interests.createdAt)),
    db.select().from(viewedContacts).orderBy(desc(viewedContacts.viewedAt)),
    db.select().from(payments).orderBy(desc(payments.paidAt)),
    db.select().from(cities),
    db.select().from(services),
  ]);

  return {
    users: allUsers,
    workerProfiles: allProfiles,
    bookings: allBookings,
    interests: allInterests,
    viewedContacts: allViewedContacts,
    payments: allPayments,
    cities: allCities,
    services: allServices,
  };
}

export async function generateDatabaseBackupExcel(): Promise<Buffer> {
  const data = await getDatabaseBackupData();

  // Maps for quick lookups
  const userMap = new Map(data.users.map((u) => [u.id, u]));
  const profileMap = new Map(data.workerProfiles.map((p) => [p.userId, p]));
  const bookingMap = new Map(data.bookings.map((b) => [b.id, b]));

  // Count interests per booking
  const interestCountsByBooking = new Map<string, number>();
  data.interests.forEach((item) => {
    interestCountsByBooking.set(
      item.bookingId,
      (interestCountsByBooking.get(item.bookingId) || 0) + 1
    );
  });

  // Count viewed contacts per booking
  const viewsCountByBooking = new Map<string, number>();
  data.viewedContacts.forEach((item) => {
    viewsCountByBooking.set(
      item.bookingId,
      (viewsCountByBooking.get(item.bookingId) || 0) + 1
    );
  });

  // Count spaces per provider
  const spacesCountByProvider = new Map<string, number>();
  data.bookings.forEach((b) => {
    spacesCountByProvider.set(
      b.customerId,
      (spacesCountByProvider.get(b.customerId) || 0) + 1
    );
  });

  // 1. Space Seekers Sheet
  const seekerUsers = data.users.filter((u) => u.role === "worker");
  const seekerRows = seekerUsers.map((user, idx) => {
    const profile = profileMap.get(user.id);
    return {
      "S.No": idx + 1,
      "Seeker ID": user.id,
      "Full Name": user.name || "N/A",
      "Mobile Number": user.mobile || "N/A",
      "Email Address": user.email || "N/A",
      "Age": profile?.age || "N/A",
      "Gender": profile?.gender || "N/A",
      "City": user.city || profile?.city || "N/A",
      "Address / Location": profile?.location || "N/A",
      "Latitude": profile?.latitude ?? "N/A",
      "Longitude": profile?.longitude ?? "N/A",
      "WhatsApp": profile?.whatsapp || user.mobile || "N/A",
      "Food Type": profile?.foodType || "N/A",
      "Work Conditions / Notes": profile?.workConditions || "N/A",
      "Rating": profile?.rating ?? 4.5,
      "Total Reviews": profile?.reviews ?? 0,
      "Registered Date": user.createdAt || "N/A",
    };
  });

  // 2. Space Providers Sheet
  const providerUsers = data.users.filter((u) => u.role === "customer");
  const providerRows = providerUsers.map((user, idx) => {
    return {
      "S.No": idx + 1,
      "Provider ID": user.id,
      "Full Name": user.name || "N/A",
      "Mobile Number": user.mobile || "N/A",
      "Email Address": user.email || "N/A",
      "City": user.city || "N/A",
      "Total Listed Spaces": spacesCountByProvider.get(user.id) || 0,
      "Verified Status": user.isVerified ? "Verified" : "Unverified",
      "Premium Member": user.isPremium ? "Yes" : "No",
      "Premium Plan": user.premiumPlan || "None",
      "Views Remaining": user.premiumViewsRemaining ?? 0,
      "Premium Expiry": user.premiumExpiresAt || "N/A",
      "Registered Date": user.createdAt || "N/A",
    };
  });

  // 3. Parking Spaces Posts with Owner Details
  const spaceRows = data.bookings.map((booking, idx) => {
    const owner = userMap.get(booking.customerId);
    const parsed = parseBookingComments(booking.comments);
    const interestCount = interestCountsByBooking.get(booking.id) || 0;
    const viewsCount = viewsCountByBooking.get(booking.id) || 0;

    return {
      "S.No": idx + 1,
      "Space Post ID": booking.id,
      "Parking Type / Service": booking.serviceName || "Parking Space",
      "Owner Name": owner?.name || "Unknown Provider",
      "Owner Mobile": owner?.mobile || "N/A",
      "Owner Email": owner?.email || "N/A",
      "Owner City": owner?.city || "N/A",
      "Space City": booking.city || owner?.city || "N/A",
      "Location Address": booking.location || "N/A",
      "Monthly Rent": parsed.rent,
      "Latitude": booking.latitude ?? "N/A",
      "Longitude": booking.longitude ?? "N/A",
      "Status": booking.status || "pending",
      "Seeker Inquiries Count": interestCount,
      "Contact Views Count": viewsCount,
      "Photos Count": parsed.photos.length,
      "Photos URLs": parsed.photos.join(", ") || "None",
      "Description": parsed.description,
      "Listed Date": booking.bookedAt || "N/A",
    };
  });

  // 4. Inquiries & Expressed Interests Sheet
  const interestRows = data.interests.map((item, idx) => {
    const booking = bookingMap.get(item.bookingId);
    const owner = booking ? userMap.get(booking.customerId) : undefined;
    const seeker = userMap.get(item.userId);
    const seekerProfile = seeker ? profileMap.get(seeker.id) : undefined;

    return {
      "S.No": idx + 1,
      "Interest ID": item.id,
      "Parking Space ID": item.bookingId,
      "Parking Service Type": booking?.serviceName || "Parking Space",
      "Space Location": booking?.location || "N/A",
      "Space City": booking?.city || "N/A",
      "Owner Name": owner?.name || "N/A",
      "Owner Mobile": owner?.mobile || "N/A",
      "Seeker Name": seeker?.name || "N/A",
      "Seeker Mobile": seeker?.mobile || "N/A",
      "Seeker City": seeker?.city || seekerProfile?.city || "N/A",
      "Inquiry Date": item.createdAt || "N/A",
    };
  });

  // 5. Contact Views Log Sheet
  const contactViewRows = data.viewedContacts.map((item, idx) => {
    const seeker = userMap.get(item.userId);
    const seekerProfile = seeker ? profileMap.get(seeker.id) : undefined;
    const booking = bookingMap.get(item.bookingId);
    const owner = booking ? userMap.get(booking.customerId) : undefined;

    return {
      "S.No": idx + 1,
      "Log ID": item.id,
      "Seeker ID": item.userId,
      "Seeker Name": seeker?.name || "N/A",
      "Seeker Mobile": seeker?.mobile || "N/A",
      "Seeker City": seeker?.city || seekerProfile?.city || "N/A",
      "Parking Space ID": item.bookingId,
      "Space Location": booking?.location || "N/A",
      "Owner Name": owner?.name || "N/A",
      "Owner Mobile": owner?.mobile || "N/A",
      "Viewed Timestamp": item.viewedAt || "N/A",
    };
  });

  // 6. Payments Sheet
  const paymentRows = data.payments.map((p, idx) => {
    const customer = userMap.get(p.customerId);
    const amountInRupees = (p.amount / 100).toFixed(2);

    return {
      "S.No": idx + 1,
      "Payment ID": p.id,
      "Customer / Provider ID": p.customerId,
      "Customer Name": customer?.name || "N/A",
      "Customer Mobile": customer?.mobile || "N/A",
      "Amount (₹)": `₹${amountInRupees}`,
      "Plan / Type": p.type || "premium_membership",
      "Status": p.status || "completed",
      "Reference ID": p.reference || "N/A",
      "Paid Date": p.paidAt || "N/A",
    };
  });

  // 7. Summary & Overview Sheet
  const totalRevenue = data.payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0) / 100;

  const summaryRows = [
    { "Metric": "Backup Generated At", "Value": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }), "Description": "Timestamp of export in IST" },
    { "Metric": "Application Name", "Value": "Spotly Parking Space Management", "Description": "Spotly India" },
    { "Metric": "Total Space Seekers", "Value": seekerUsers.length, "Description": "All registered space seeker / worker accounts" },
    { "Metric": "Total Space Providers", "Value": providerUsers.length, "Description": "All registered space provider / customer accounts" },
    { "Metric": "Total Parking Spaces Listed", "Value": data.bookings.length, "Description": "Total parking space posts with owner details" },
    { "Metric": "Total Inquiries / Interests Expressed", "Value": data.interests.length, "Description": "Seeker interest submissions on parking spaces" },
    { "Metric": "Total Contact Views Logged", "Value": data.viewedContacts.length, "Description": "Seekers who unlocked/viewed provider contact details" },
    { "Metric": "Total Payment Transactions", "Value": data.payments.length, "Description": "Total payments recorded" },
    { "Metric": "Total Completed Revenue (₹)", "Value": `₹${totalRevenue.toLocaleString("en-IN")}`, "Description": "Sum of all completed transactions" },
  ];

  // Build the Workbook
  const workbook = XLSX.utils.book_new();

  function appendJsonSheet(name: string, rows: any[]) {
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Status": "No records found" }]);
    // Auto-fit column widths based on longest string
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      ws["!cols"] = keys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...rows.map((r) => String(r[key] || "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
      });
    }
    XLSX.utils.book_append_sheet(workbook, ws, name);
  }

  appendJsonSheet("System Summary", summaryRows);
  appendJsonSheet("Parking Spaces & Owners", spaceRows);
  appendJsonSheet("Space Seekers", seekerRows);
  appendJsonSheet("Space Providers", providerRows);
  appendJsonSheet("Interests & Inquiries", interestRows);
  appendJsonSheet("Contact Views Log", contactViewRows);
  appendJsonSheet("Payments", paymentRows);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
