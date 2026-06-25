(function () {
  let isFirebase = false;
  let auth = null;
  let db = null;

  // Check if Firebase is configured in window.ENV
  if (
    window.ENV &&
    window.ENV.apiKey &&
    window.ENV.projectId &&
    typeof firebase !== 'undefined'
  ) {
    try {
      const firebaseConfig = {
        apiKey: window.ENV.apiKey,
        authDomain: window.ENV.authDomain,
        projectId: window.ENV.projectId,
        storageBucket: window.ENV.storageBucket,
        messagingSenderId: window.ENV.messagingSenderId,
        appId: window.ENV.appId,
        measurementId: window.ENV.measurementId
      };
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      isFirebase = true;
      console.log("Firebase initialized successfully for Tasteit.");
    } catch (e) {
      console.error("Firebase initialization failed, falling back to localStorage:", e);
    }
  } else {
    console.log("Firebase credentials not detected. Running in Local Storage Mode.");
  }

  // Helper to generate UUIDs locally
  function generateUUID() {
    return 'xyxx-yxxx-yxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const dbApi = {
    isFirebaseUsed: () => isFirebase,

    // Authentication Actions
    login: async (usernameOrEmail, password) => {
      if (isFirebase) {
        // If it's a simple username, append a default domain to make it look like an email
        const email = usernameOrEmail.includes('@')
          ? usernameOrEmail
          : `${usernameOrEmail}@hotel.com`;
        return auth.signInWithEmailAndPassword(email, password);
      } else {
        const expectedUser = localStorage.getItem('admin_username') || (window.ENV && window.ENV.ADMIN_USERNAME) || 'admin@yourhotel.com';
        const expectedPass = localStorage.getItem('admin_password') || (window.ENV && window.ENV.ADMIN_PASSWORD) || 'admin123';
        
        if (usernameOrEmail === expectedUser && password === expectedPass) {
          localStorage.setItem('local_session', 'true');
          return { email: expectedUser };
        } else {
          throw new Error('Invalid username or password');
        }
      }
    },

    logout: async () => {
      if (isFirebase) {
        return auth.signOut();
      } else {
        localStorage.removeItem('local_session');
        return true;
      }
    },

    getCurrentUser: async () => {
      if (isFirebase) {
        return new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });
      } else {
        const isLogged = localStorage.getItem('local_session') === 'true';
        if (isLogged) {
          const username = localStorage.getItem('admin_username') || (window.ENV && window.ENV.ADMIN_USERNAME) || 'admin@yourhotel.com';
          return { email: username };
        }
        return null;
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      if (isFirebase) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is currently logged in');
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        return user.updatePassword(newPassword);
      } else {
        const expectedPass = localStorage.getItem('admin_password') || (window.ENV && window.ENV.ADMIN_PASSWORD) || 'admin123';
        if (currentPassword !== expectedPass) {
          throw new Error('Current password is incorrect');
        }
        localStorage.setItem('admin_password', newPassword);
        return true;
      }
    },

    // Site Settings Configuration
    getSettings: async () => {
      const defaultSettings = {
        restaurantName: 'Taste.it',
        facebookLink: '#',
        instagramLink: '#',
        twitterLink: '#',
        googleMapsEmbed: '',
        openingTime: '9:00',
        closingTime: '24:00'
      };

      if (isFirebase) {
        const doc = await db.collection('settings').doc('config').get();
        return doc.exists ? { ...defaultSettings, ...doc.data() } : defaultSettings;
      } else {
        const local = localStorage.getItem('settings');
        return local ? { ...defaultSettings, ...JSON.parse(local) } : defaultSettings;
      }
    },

    saveSettings: async (settingsData) => {
      if (isFirebase) {
        return db.collection('settings').doc('config').set(settingsData, { merge: true });
      } else {
        localStorage.setItem('settings', JSON.stringify(settingsData));
        return settingsData;
      }
    },

    // Homepage Images Customization
    getHomepageImages: async () => {
      const defaultImages = {
        heroImage1: 'images/bg_1.jpg',
        heroImage1Secondary: 'images/menu-1.jpg',
        heroImage2: 'images/bg_2.jpg',
        heroImage2Secondary: 'images/menu-2.jpg',
        aboutImage1: 'images/about.jpg',
        aboutImage2: 'images/bg_6.jpg',
        bookingSideImage: 'images/about.jpg',
        menuHeaderImage: 'images/bg_3.jpg',
        galleryHeaderImage: 'images/bg_4.jpg',
        contactHeaderImage: 'images/bg_5.jpg'
      };

      if (isFirebase) {
        const doc = await db.collection('settings').doc('homepageImages').get();
        return doc.exists ? { ...defaultImages, ...doc.data() } : defaultImages;
      } else {
        const local = localStorage.getItem('homepageImages');
        return local ? { ...defaultImages, ...JSON.parse(local) } : defaultImages;
      }
    },

    saveHomepageImages: async (imagesData) => {
      if (isFirebase) {
        return db.collection('settings').doc('homepageImages').set(imagesData, { merge: true });
      } else {
        localStorage.setItem('homepageImages', JSON.stringify(imagesData));
        return imagesData;
      }
    },

    // Table Bookings Management
    getBookings: async () => {
      if (isFirebase) {
        const snap = await db.collection('bookings').orderBy('createdAt', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        return JSON.parse(localStorage.getItem('bookings') || '[]');
      }
    },

    addBooking: async (bookingData) => {
      const record = {
        name: bookingData.name || '',
        phone: bookingData.phone || '',
        email: bookingData.email || '',
        date: bookingData.date || '',
        time: bookingData.time || '',
        guests: bookingData.guests || '',
        message: bookingData.message || '',
        createdAt: new Date().toISOString()
      };

      if (isFirebase) {
        const docRef = await db.collection('bookings').add(record);
        return { id: docRef.id, ...record };
      } else {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const fullRecord = { id: generateUUID(), ...record };
        bookings.unshift(fullRecord);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return fullRecord;
      }
    },

    deleteBooking: async (bookingId) => {
      if (isFirebase) {
        return db.collection('bookings').doc(bookingId).delete();
      } else {
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
      }
    },

    // Gallery / Menu Uploads
    getImages: async () => {
      if (isFirebase) {
        try {
          const snap = await db.collection('images').orderBy('createdAt', 'desc').get();
          return snap.docs.map(doc => doc.data());
        } catch (e) {
          console.error("Failed to fetch images from Firestore, returning empty list:", e);
          return [];
        }
      } else {
        return JSON.parse(localStorage.getItem('images') || '[]');
      }
    },

    uploadImage: async (file, type, title, imageUrlRaw = '') => {
      let imageUrl = imageUrlRaw;
      let publicId = '';

      if (file) {
        const hasCloudinary = window.ENV && window.ENV.CLOUDINARY_CLOUD_NAME && window.ENV.CLOUDINARY_UPLOAD_PRESET;

        if (hasCloudinary) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', window.ENV.CLOUDINARY_UPLOAD_PRESET);
          const cloudName = window.ENV.CLOUDINARY_CLOUD_NAME;

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Cloudinary upload failed');
          }

          const data = await response.json();
          imageUrl = data.secure_url;
          publicId = data.public_id;
        } else {
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          publicId = 'local-' + Date.now();
        }
      }

      if (!imageUrl) {
        throw new Error('Please select an image file or enter an image URL.');
      }

      const id = generateUUID();
      const imageData = {
        id: id,
        title: title || 'Uploaded image',
        imageUrl: imageUrl,
        publicId: publicId,
        type: type, // 'menu' or 'item'
        createdAt: new Date().toISOString()
      };

      if (isFirebase) {
        await db.collection('images').doc(id).set(imageData);
      } else {
        const images = JSON.parse(localStorage.getItem('images') || '[]');
        images.unshift(imageData);
        localStorage.setItem('images', JSON.stringify(images));
      }

      return imageData;
    },

    deleteImage: async (imageId) => {
      if (isFirebase) {
        return db.collection('images').doc(imageId).delete();
      } else {
        let images = JSON.parse(localStorage.getItem('images') || '[]');
        images = images.filter(img => img.id !== imageId);
        localStorage.setItem('images', JSON.stringify(images));
        return true;
      }
    }
  };

  window.dbApi = dbApi;
})();
