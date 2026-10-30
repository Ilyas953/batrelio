// Shared by the customer form (browser) and the server that stores the request.
export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_ADDRESS_LENGTH = 500;
export const MAX_CUSTOMER_NAME_LENGTH = 120;
export const PHOTO_BUCKET = "request-photos";
