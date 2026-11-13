# Homestay

A full-stack Airbnb-style stay booking platform built with **Node.js, Express 5, MongoDB and EJS**. Browse handpicked stays, filter and search listings, read reviews, host your own place, and book a stay through a simulated checkout flow.

## Features

- **Authentication** — signup, login, logout with Passport (local strategy) and flash messages.
- **Listings** — create, edit and delete your own listings with Cloudinary image uploads.
- **Discovery** — category filters, keyword search, price/rating filters, and sorting (newest, price low/high).
- **Maps** — Mapbox geocoding on listing creation and an interactive map on each listing page.
- **Reviews** — star ratings and comments; authors can delete their own reviews.
- **Bookings** — date selection, availability checks, nights/guests validation, 18% GST pricing, and a **simulated** card/UPI/net-banking payment.
- **My trips** — view and cancel upcoming bookings.
- **My listings** — a host dashboard for the places you own.
- **Polished UI** — responsive Bootstrap 5 layout, category chips, GST price toggle, Lenis smooth scrolling, loading states and accessible forms.
- **Serverless-ready** — deployable to Vercel with `/health` reporting the deployed commit and database state.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database | MongoDB (Atlas), Mongoose |
| Views | EJS, ejs-mate, Bootstrap 5, Font Awesome |
| Auth | Passport, passport-local-mongoose, express-session |
| Uploads | Multer + Cloudinary |
| Maps | Mapbox SDK + Mapbox GL JS |
| Deployment | Vercel (serverless function in `api/index.js`) |

## Project Structure

```
app.js              Express app, middleware and serverless-safe startup
api/index.js        Vercel serverless entry point
controllers/        Route handlers (listings, users, reviews, bookings)
models/             Mongoose schemas (Listing, User, Review, Booking)
routes/             Express routers
middleware/         Auth, ownership and validation middleware
views/              EJS templates and layouts
public/             CSS, client-side JS and static assets
utils/              Error wrapper and demo payment gateway
init/               Sample data and seeding script
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Prakritiwari/Homestay.git
cd Homestay
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/homestay
MONGO_DB_NAME=homestay
SESSION_SECRET=change-me-to-a-long-random-string

MAP_TOKEN=your_mapbox_access_token

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

- `MONGO_DB_NAME` is optional when the database name is already included in `MONGO_URI`.
- Never commit `.env`.

### 3. Run locally

```bash
node app.js
```

Open <http://localhost:8080>.

### Optional: seed sample data

`init/index.js` currently connects to a **local** MongoDB instance and replaces the `listings` collection. If you want to seed Atlas instead, update its connection string before running:

```bash
node init/index.js
```

## Deployment (Vercel)

1. Import the repository into Vercel with the **repo root** as the root directory.
2. Add all environment variables above to **Production** (and Preview if needed).
3. In MongoDB Atlas, allow access from `0.0.0.0/0` (Vercel functions use dynamic IPs).
4. Deploy. The serverless entry point is `api/index.js`; `vercel.json` rewrites all traffic to it and bundles `views/` and `public/`.

Verify the deployment:

```bash
curl https://<your-domain>/health
# {"ok":true,"commit":"<sha>","database":"connected","dbName":"homestay",...}
```

## Notes

- Payments are **simulated** for demonstration purposes — do not enter real card details.
- Sessions use an in-memory store by default, which is fine for local development. For reliable logins on serverless hosting, use a persistent session store such as `connect-mongo`.
- Listing images are uploaded to Cloudinary, so a valid Cloudinary account is required.

## License

Built for educational and portfolio purposes.
