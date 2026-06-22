# Taste.it - Sellable Hotel/Restaurant Website Template

A complete, ready-to-deploy hotel and restaurant website template with admin dashboard, booking system, Cloudinary image uploads, and editable settings.

## Features

- **Admin Dashboard** (`/admin`) - Manage bookings, upload images, and edit website settings
- **Booking System** - Customers can book tables via reservation forms
- **Image Gallery** - Upload and display menu/item images via Cloudinary
- **Editable Settings** - Change restaurant name, social links, hours, and homepage images
- **Dynamic Footer** - Auto-updates with restaurant name, hours, social links, and map
- **Vercel Ready** - Deploy with a single command

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-secure-password
   SESSION_SECRET=your-long-random-secret-string
   
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   
   PORT=3000
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```
   
   The site will be available at `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/admin`

## Deployment to Vercel

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts. Vercel will automatically detect the configuration from `vercel.json`.

3. **Set environment variables in Vercel**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add all the variables from `.env.example`

4. **Access your deployed site**
   - Public site: Your Vercel URL
   - Admin dashboard: `https://your-domain.vercel.app/admin`

## Admin Dashboard

Access the admin dashboard at `/admin` using the credentials from your environment variables.

### Dashboard Sections

- **Bookings** - View all table reservation requests
- **Menu Images** - Upload full menu images or individual item images
- **Website Settings** - Edit restaurant name, social links, opening hours, and Google Maps
- **Homepage Images** - Set Cloudinary URLs for hero, about, and page header images

## Public Pages

- **Home** (`index.html`) - Main landing page
- **About** (`about.html`) - About the restaurant
- **Chef** (`chef.html`) - Meet the team
- **Menu** (`menu.html`) - Menu items
- **Reservation** (`reservation.html`) - Book a table
- **Images** (`gallery.html`) - View uploaded menu and item images
- **Contact** (`contact.html`) - Contact information and map

## Verification

Run syntax checks:
```bash
npm run check
```

Run smoke tests:
```bash
npm run smoke
```

## Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env` file or Vercel environment variables

## Notes

- The admin page is intentionally hidden from public navigation
- All data is stored in a JSON file (for Vercel serverless, consider upgrading to a database for production)
- Images are stored in Cloudinary CDN
- The template uses the original design with added dynamic functionality

## License

This template is based on the Taste.it template by Colorlib, licensed under CC BY 3.0.
