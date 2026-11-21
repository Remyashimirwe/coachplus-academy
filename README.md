# CoachPlus Academy 
 
CoachPlus Academy is a full-stack education platform built with Next.js, Prisma, and PostgreSQL. It helps schools and coaching organizations manage student requests, teacher applications, attendance, notifications, and admin workflows from a single system.

## Overview 

The platform supports:     
 
- Public landing pages for prospective students and teachers
- Student enrollment and coaching requests 
- Teacher application and approval flow 
- Secure admin dashboard for managing users and requests 
- Attendance tracking for students and teachers
- Notifications and invite emails 
- Program, subject, and topic management
- Role-based access for admin, teacher, and student users

## Tech Stack 

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Resend for email delivery
- Cloudinary for media upload management
- PostgreSQL driver with Prisma adapter

## Project Structure

```bash
.
├── app/                     # App routes, pages, and UI
│   ├── admin/              # Admin dashboard pages and components
│   ├── api/                # Server-side API routes
│   ├── student/            # Student portal pages
│   ├── teacher/            # Teacher portal pages
│   ├── login/              # Authentication pages
│   ├── setup-password/     # Invite password setup flows
│   └── ...
├── prisma/
│   └── schema.prisma        # Database schemas
├── public/                  # Static assets and branding files
├── app/lib/                 # Shared logic and service helpers
├── seed.ts                  # Seed script for admin setup
├── package.json             # Scripts and dependencies
├── next.config.ts
├── middleware.ts
├── tsconfig.json
├── README.md
└── ...
```

## Prerequisites

Before running the project locally, make sure you have:

- Node.js 20+
- npm or pnpm
- PostgreSQL database
- Access to a mail provider if you want invite emails to send through Resend

## Environment Variables

Copy the sample file and adjust the values for your environment:

```bash
cp .env.example .env.local
```

The sample file includes:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/coachplus_academy"
SESSION_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
ADMIN_EMAIL="admin@coachplusacademy.com"
ADMIN_PASSWORD="admin123"
EMAIL_FROM="CoachPlus Academy <admin@coachplusacademy.com>"
RESEND_API_KEY="your_resend_api_key"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

Notes:

- `DATABASE_URL` is required for Prisma and the app database connection.
- `RESEND_API_KEY` is optional for local development; if absent, the app logs the invite URL instead of sending email.
- `SESSION_SECRET` should be a secure random value in production.

## Installation

```bash
npm install
```

## Database Setup

Generate Prisma client and apply the schema:

```bash
npx prisma generate
npx prisma db push
```

If you want the default admin account seeded:

```bash
node seed.ts
```

This creates an admin user using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your environment.

## Run the App

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful Scripts

```bash
npm run dev      # run local development server
npm run build    # generate Prisma client and build production app
npm run start    # run production build
npm run lint     # run ESLint checks
```

## Admin Access

After seeding, sign in using the admin credentials created by `seed.ts` or the values from your `.env.local` file.

## Features in More Detail

### Student Experience

Students can request coaching, specify preferred programs, learning styles, and scheduling windows, and then track status through the academy workflow.

### Teacher Experience

Teachers can apply, upload profile information, and receive approvals through a structured application and invite flow.

### Admin Experience

Admins manage:

- teacher applications
- student requests
- invited accounts
- attendance logs
- program catalog
- notifications and communication

### Attendance and Reporting

The system tracks both student and teacher attendance, stores remarks and time usage, and supports structured reporting for follow-up and review.

## Deployment

This project is designed for deployment on modern hosting platforms like Vercel or any Node.js environment with PostgreSQL support.

Recommended production setup:

- PostgreSQL database hosted securely
- Environment variables configured in production
- Strong `SESSION_SECRET`
- `APP_URL` set to your production domain
- `RESEND_API_KEY` configured for outbound email deliverys
-
## Notes

- The app uses Prisma with PostgreSQL and is optimized for a hosted database such as Neon, Supabase, or a managed Postgres service.
- The default app name in package metadata is `wecouch`, but the product branding is CoachPlus Academy.

## License

This project does not currently include a license file. If you are using this repository internally, confirm your licensing and usage terms with your organization before publishing or distributing it.
