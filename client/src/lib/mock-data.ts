import { 
  Car,
  Bike,
  ParkingCircle
} from "lucide-react";

// Import parking banner images
import parkingBanner1 from "../assets/banners/parking_banner_1.jpg";
import parkingBanner2 from "../assets/banners/parking_banner_2.jpg";
import parkingBanner3 from "../assets/banners/parking_banner_3.jpg";
import parkingBanner4 from "../assets/banners/parking_banner_4.jpg";
import parkingBanner5 from "../assets/banners/parking_banner_5.jpg";
import parkingBanner6 from "../assets/banners/parking_banner_6.jpg";

export const SERVICES = [
  { id: "car-parking", name: "Car Parking", icon: Car, color: "bg-green-500 text-white" },
  { id: "bike-parking", name: "Bike Parking", icon: Bike, color: "bg-blue-500 text-white" },
  { id: "car-bike-parking", name: "Car & Bike Parking", icon: ParkingCircle, color: "bg-[#0d3da8] text-white" },
];

export const BANNERS = [
  { id: 1, image: parkingBanner1, title: "Premium Car Parking", serviceName: "car-parking" },
  { id: 2, image: parkingBanner2, title: "Bike Parking Zones", serviceName: "bike-parking" },
  { id: 3, image: parkingBanner3, title: "Covered Parking Spaces", serviceName: "covered-parking" },
  { id: 4, image: parkingBanner4, title: "Monthly Parking Deals", serviceName: "monthly-parking" },
  { id: 5, image: parkingBanner5, title: "Secure Parking Areas", serviceName: "secure-parking" },
  { id: 6, image: parkingBanner6, title: "Near You Parking Spots", serviceName: "nearby-parking" },
];

export const MOCK_BOOKINGS = [
  {
    id: "BK-7829",
    service: "Car Parking",
    date: "2025-05-12",
    time: "10:00 AM",
    location: "123 Green Valley, Block A",
    status: "accepted",
    worker: {
      name: "Rajesh Kumar",
      age: 34,
      gender: "Male",
      mobile: "+91 987 654 3210",
      whatsapp: "+91 987 654 3210",
      location: "Downtown Area",
    }
  },
  {
    id: "BK-9921",
    service: "Bike Parking",
    date: "2025-05-15",
    time: "02:00 PM",
    location: "456 Hilltop Road",
    status: "pending",
    worker: null
  }
];

export const MOCK_JOB_REQUESTS = [
  {
    id: "JR-101",
    service: "Car Parking",
    distance: "1.2 km",
    travelTime: "5 mins",
    instructions: "Covered parking space available near main road.",
    location: "Sunny Side Apartments",
    foodType: "veg",
    date: "2025-12-19",
    time: "10:00 AM",
  },
  {
    id: "JR-102",
    service: "Bike Parking",
    distance: "3.5 km",
    travelTime: "15 mins",
    instructions: "Secure bike parking with CCTV surveillance.",
    location: "Oakwood Residency",
    foodType: "veg",
    date: "2025-12-20",
    time: "09:00 AM",
  },
  {
    id: "JR-103",
    service: "Car & Bike Parking",
    distance: "0.8 km",
    travelTime: "3 mins",
    instructions: "Open parking area with 24/7 access.",
    location: "Blue Bell Complex",
    foodType: "veg",
    date: "2025-12-21",
    time: "04:00 PM",
  }
];

export const WORKER_SKILLS = [
  "Car Parking", "Bike Parking", "Car & Bike Parking"
];

export const MOCK_WORKER_CONTACTS = [
  {
    id: "w1",
    name: "Lakshmi Devi",
    location: "Koramangala",
    city: "bangalore",
    latitude: 12.9352,
    longitude: 77.6245,
    age: 32,
    gender: "Female",
    services: ["Car Parking"],
    foodType: "veg",
    rating: 4.8,
    reviews: 127,
    mobile: "+91 9876543210",
    whatsapp: "+91 9876543210",
    isFavorite: true,
  },
  {
    id: "w2",
    name: "Priya Sharma",
    location: "Indiranagar",
    city: "bangalore",
    latitude: 12.9784,
    longitude: 77.6408,
    age: 28,
    gender: "Female",
    services: ["Bike Parking"],
    foodType: "veg",
    rating: 4.9,
    reviews: 98,
    mobile: "+91 8765432109",
    whatsapp: "+91 8765432109",
    isFavorite: false,
  },
  {
    id: "w3",
    name: "Kavitha Rajan",
    location: "HSR Layout",
    city: "bangalore",
    latitude: 12.9116,
    longitude: 77.6389,
    age: 35,
    gender: "Female",
    services: ["Car & Bike Parking"],
    foodType: "veg",
    rating: 4.7,
    reviews: 156,
    mobile: "+91 7654321098",
    whatsapp: "+91 7654321098",
    isFavorite: true,
  },
  {
    id: "w4",
    name: "Ramesh Kumar",
    location: "Whitefield",
    city: "bangalore",
    latitude: 12.9698,
    longitude: 77.7500,
    age: 40,
    gender: "Male",
    services: ["Car Parking", "Bike Parking"],
    foodType: "veg",
    rating: 4.6,
    reviews: 89,
    mobile: "+91 6543210987",
    whatsapp: "+91 6543210987",
    isFavorite: false,
  },
  {
    id: "w5",
    name: "Anitha Krishnan",
    location: "Jayanagar",
    city: "bangalore",
    latitude: 12.9308,
    longitude: 77.5838,
    age: 26,
    gender: "Female",
    services: ["Car & Bike Parking"],
    foodType: "veg",
    rating: 4.9,
    reviews: 203,
    mobile: "+91 5432109876",
    whatsapp: "+91 5432109876",
    isFavorite: true,
  },
  {
    id: "w6",
    name: "Meena Sundaram",
    location: "T. Nagar",
    city: "chennai",
    latitude: 13.0418,
    longitude: 80.2341,
    age: 30,
    gender: "Female",
    services: ["Car Parking"],
    foodType: "veg",
    rating: 4.8,
    reviews: 145,
    mobile: "+91 9988776655",
    whatsapp: "+91 9988776655",
    isFavorite: false,
  },
  {
    id: "w7",
    name: "Vijay Anand",
    location: "Anna Nagar",
    city: "chennai",
    latitude: 13.0850,
    longitude: 80.2101,
    age: 38,
    gender: "Male",
    services: ["Bike Parking"],
    foodType: "veg",
    rating: 4.5,
    reviews: 67,
    mobile: "+91 8877665544",
    whatsapp: "+91 8877665544",
    isFavorite: false,
  },
  {
    id: "w8",
    name: "Selvi Murugan",
    location: "Velachery",
    city: "chennai",
    latitude: 12.9815,
    longitude: 80.2180,
    age: 29,
    gender: "Female",
    services: ["Car & Bike Parking"],
    foodType: "veg",
    rating: 4.7,
    reviews: 112,
    mobile: "+91 7766554433",
    whatsapp: "+91 7766554433",
    isFavorite: true,
  },
  {
    id: "w9",
    name: "Kannan Pillai",
    location: "Adyar",
    city: "chennai",
    latitude: 13.0012,
    longitude: 80.2565,
    age: 45,
    gender: "Male",
    services: ["Car Parking", "Bike Parking"],
    foodType: "veg",
    rating: 4.4,
    reviews: 78,
    mobile: "+91 6655443322",
    whatsapp: "+91 6655443322",
    isFavorite: false,
  },
  {
    id: "w10",
    name: "Revathi Balan",
    location: "Mylapore",
    city: "chennai",
    latitude: 13.0338,
    longitude: 80.2676,
    age: 33,
    gender: "Female",
    services: ["Car & Bike Parking"],
    foodType: "veg",
    rating: 4.9,
    reviews: 189,
    mobile: "+91 5544332211",
    whatsapp: "+91 5544332211",
    isFavorite: true,
  },
];

export const MOCK_NOTIFICATIONS: Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
}> = [];
