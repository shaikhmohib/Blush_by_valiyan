# Blush By Valiyan — Makeup Artist Portfolio

A responsive makeup artist portfolio featuring a public website, dynamic services and gallery, secure admin dashboard, customer inquiries, EmailJS notifications, and WhatsApp integration.

## Features

- Responsive makeup artist portfolio
- Services listing and management
- Portfolio gallery with image uploads
- Admin login and protected management APIs
- Add, edit, and delete services
- Upload and delete gallery photos
- Customer inquiry management
- Email notifications using EmailJS
- WhatsApp inquiry links
- Business contact and social media settings
- MongoDB database integration

## Technology Stack

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB native Node.js driver
- JWT authentication
- bcryptjs password hashing
- Multer image uploads

**Integrations**
- EmailJS
- WhatsApp click-to-chat

## Project Structure

```text
blush-by-valiyan/
├── frontend/
│   ├── admin/
│   ├── css/
│   ├── js/
│   ├── images/
│   └── index.html
├── backend/
│   ├── scripts/
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Git](https://git-scm.com/downloads)

Make sure your local MongoDB service is running.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/shaikhmohib/Blush_by_valiyan.git
cd Blush_by_valiyan
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Copy `backend/.env.example` to `backend/.env`.

On Windows PowerShell, run this command from the `backend` directory:

```powershell
Copy-Item .env.example .env
```

Open `.env` and configure your local settings:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=blush_by_valiyan
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_NAME=Portfolio Admin
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your_strong_password
FRONTEND_ORIGIN=http://localhost:5000
```

Generate a random JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a strong, unique admin password that meets the minimum length configured in `backend/scripts/create-admin.js`.

**Important:** Never commit your real `.env` file or publish your admin password or JWT secret.

### 4. Create the admin account

Run this command from the `backend` directory:

```bash
npm run create-admin
```

The script creates or updates the admin account using the credentials in `.env`.

### 5. Start the development server

```bash
npm run dev
```

Open the following URLs:

- **Public website:** http://localhost:5000
- **Admin login:** http://localhost:5000/admin
- **API health check:** http://localhost:5000/api/health

Log in using the admin email and password configured in `.env`.

## EmailJS Configuration

1. Create an account at [EmailJS](https://www.emailjs.com/).
2. Configure an email service.
3. Create an email template with these variables:

   - `{{from_name}}`
   - `{{from_email}}`
   - `{{phone}}`
   - `{{service}}`
   - `{{event_date}}`
   - `{{message}}`

4. Open `frontend/js/contact.js`.
5. Replace the EmailJS public key, service ID, and template ID placeholders.
6. Submit a test inquiry and verify delivery.

EmailJS notifications will not work until the correct values are configured. The inquiry is saved in MongoDB even if the email notification fails.

## WhatsApp Configuration

1. Open the admin dashboard.
2. Select **Site settings**.
3. Enter the WhatsApp number in international format using digits only, for example `919876543210`.
4. Open `frontend/js/contact.js` and configure `OWNER_WHATSAPP` with the same number.

WhatsApp links open a prefilled message. The visitor must press **Send**. Automated WhatsApp notifications require the WhatsApp Business Platform and additional server-side integration.

## Admin Dashboard

Open:

```text
http://localhost:5000/admin
```

The dashboard supports:

- Service creation, editing, and deletion
- Portfolio photo uploads and deletion
- Inquiry review and status updates
- Email and WhatsApp reply links
- Business contact and social media settings

Admin APIs require authentication. The `/admin` URL itself is not a security mechanism; access is protected by the login and API authentication.

## Database and Image Storage

The project uses a local MongoDB database named `blush_by_valiyan`.

Uploaded photos are stored in:

```text
backend/uploads/
```

Back up your database and uploaded images. For production hosting, use persistent storage or an appropriate image-storage service.

## Security Notes

- Use a strong, unique admin password.
- Keep `.env` out of Git.
- Use HTTPS and a secure JWT secret in production.
- Configure CORS for your real website domain.
- Validate uploaded files and keep dependencies updated.
- Use persistent media storage and regular backups when deploying.
- Configure EmailJS restrictions and template settings.

## Troubleshooting

**MongoDB connection error**

Check that MongoDB is installed, running, and using the URI configured in `.env`.

**Admin login fails**

Check `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run:

```bash
npm run create-admin
```

**Port 5000 is already in use**

Change `PORT` in `.env` and restart the server.

**Email notifications fail**

Verify your EmailJS public key, service ID, template ID, template variables, and service connection.

**Image upload fails**

Use JPG, PNG, WEBP, or GIF images that are no larger than 5 MB.

## Repository

[Blush By Valiyan on GitHub](https://github.com/shaikhmohib/Blush_by_valiyan)

## License

This project is currently intended for personal and portfolio use.
