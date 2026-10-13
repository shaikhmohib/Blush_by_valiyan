# Blush By Valiyan — Makeup Artist Portfolio

A responsive makeup artist portfolio with a public services/gallery website, MongoDB-backed content, secure admin login, CRUD tools, inquiry inbox, EmailJS notifications and WhatsApp links.

## Stack
- HTML, CSS, vanilla JavaScript
- Node.js + Express
- MongoDB native Node.js driver (no Mongoose)
- JWT authentication, bcrypt password hashing
- Multer image uploads (5 MB limit)

## 1. Requirements
Install Node.js LTS and MongoDB Community Server. Make sure MongoDB is running locally.

## 2. Configure backend
Open a terminal in this project:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and change the admin password and JWT secret. Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=blush_by_valiyan
JWT_SECRET=put_a_long_random_secret_here_at_least_32_characters
ADMIN_NAME=Portfolio Admin
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=ChangeThisPassword123!
FRONTEND_ORIGIN=http://localhost:5000
```

Use a unique password of at least 12 characters. Never commit `.env`.

## 3. Create the first admin

```bash
npm run create-admin
```

The command hashes the password and upserts the configured admin account. There is no public registration endpoint.

## 4. Run the website

```bash
npm run dev
```

Open:
- Public website: http://localhost:5000
- Admin login: http://localhost:5000/admin
- Health check: http://localhost:5000/api/health

Sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Change the example password before use.

## 5. Configure EmailJS
1. Create an account at https://www.emailjs.com/.
2. Add an email service and create a template.
3. Template variables: `{{from_name}}`, `{{from_email}}`, `{{phone}}`, `{{service}}`, `{{event_date}}`, `{{message}}`.
4. Open `frontend/js/contact.js` and replace `YOUR_EMAILJS_PUBLIC_KEY`, `YOUR_EMAILJS_SERVICE_ID`, and `YOUR_EMAILJS_TEMPLATE_ID`.
5. Submit a test enquiry. Confirm the EmailJS template sends to the portfolio owner's email.

EmailJS public keys are intended for browser use; do not put private email-service secrets in frontend code. The backend stores an inquiry even when email notification fails. Check the EmailJS dashboard and spam folder when testing.

## 6. Configure WhatsApp
- Sign in to `/admin`, choose **Site settings**, and set the WhatsApp number in international format using digits only, e.g. `919876543210`.
- In `frontend/js/contact.js`, set `OWNER_WHATSAPP` to the same digits-only number to show an enquiry-specific WhatsApp link after the form is submitted.
- WhatsApp links open a prefilled message; the visitor must press Send. Automatic WhatsApp notifications require the WhatsApp Business Platform and server-side credentials.

## 7. Manage content
From `/admin`:
- Services: add, edit, delete, set visibility and prices.
- Gallery: upload and delete images.
- Enquiries: review submissions, update status, reply by email or WhatsApp.
- Site settings: update email, WhatsApp, Instagram and business details.

Uploaded images are stored locally under `backend/uploads`. Back them up along with the MongoDB database. Local disk uploads are suitable for development; use persistent storage or an object-storage service when deploying.

## Important production notes
- Use HTTPS and a strong, unique JWT secret.
- Use secure deployment secrets, not `.env` committed to source control.
- Consider moving JWTs from localStorage to secure, HttpOnly cookies before production.
- Validate uploaded image content server-side (MIME alone is not sufficient), add backups, and configure persistent media storage.
- Set appropriate CORS origins and rate limits for your real domain.
- Configure EmailJS allowed domains and template settings.
- This starter saves inquiries in MongoDB and sends email through EmailJS in the browser; it does not claim guaranteed email delivery.

## Troubleshooting
- **MongoDB connection error:** ensure the MongoDB service is running and `MONGODB_URI` is correct.
- **Login rejected:** rerun `npm run create-admin` after editing `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- **Port already in use:** change `PORT` in `.env`.
- **Email not sent:** check all three EmailJS values, template variables, service connection and EmailJS logs.
- **Image upload rejected:** use JPG, PNG, WEBP or GIF under 5 MB.
