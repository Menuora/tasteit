// Configuration file template for Hotel/Restaurant Templates
// Rename this file to env.js and populate your credentials below:
window.ENV = {
  // 1. Firebase API Configuration
  // Leave these empty to run the template in Local Storage mode (great for offline development)
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID",

  // 2. Cloudinary configuration (optional, for client-side uploads)
  // Create an unsigned upload preset in Cloudinary to allow direct uploading from client-side
  CLOUDINARY_CLOUD_NAME: "YOUR_CLOUDINARY_CLOUD_NAME",
  CLOUDINARY_UPLOAD_PRESET: "YOUR_CLOUDINARY_UPLOAD_PRESET",

  // 3. Fallback Admin Credentials (only used when Firebase is NOT configured)
  ADMIN_USERNAME: "admin@yourhotel.com",
  ADMIN_PASSWORD: "[PASSWORD]"
};
