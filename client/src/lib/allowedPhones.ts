export const allowedPhones = [
  "7829551049",
  "9742545584",
  "7338507767",
  "9180532078"
];

export const isAllowedPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, "");
  return allowedPhones.includes(digits);
};
