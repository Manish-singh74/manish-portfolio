# Manish Singh — Data Analyst Portfolio (Supabase Dynamic Version)

This version turns the portfolio into a cloud-managed website using **Supabase PostgreSQL + Supabase Storage + Supabase Auth**.

## What is now dynamic?

- Unlimited projects: add, edit and delete from the portfolio manager.
- Unlimited certificates: add, edit and delete; JPG/PNG/PDF uploads are supported.
- Project screenshots are stored in Supabase Storage.
- Certificate files are stored in Supabase Storage.
- Profile photo and resume can be replaced from the manager.
- Name, role, tagline, location, phone, email, LinkedIn, GitHub and portfolio URL are stored in Supabase.
- Contact form messages are saved in the `contact_messages` table.
- Public visitors can read portfolio data without logging in.
- Only an authenticated Supabase admin can change portfolio data.
- RLS protects database and Storage operations.
- Content can be managed from another laptop/browser after signing in.

## 1. Create a Supabase project

1. Open the official Supabase dashboard.
2. Create a new project.
3. Open **SQL Editor**.
4. Open `supabase-schema.sql` from this folder.
5. First create your admin account in **Authentication → Users → Add user**.
6. In `supabase-schema.sql`, replace:

```text
YOUR_ADMIN_EMAIL
```

with the exact email address of the user you will sign in with. The SQL looks up that user's Auth UUID and adds it to `portfolio_admins`.

8. Run the complete SQL script.

If the schema was already run and admin login says the account is not authorized, run the admin insert block again in the SQL Editor with your admin email substituted. Then sign out and sign in again.

The SQL creates:

- `portfolio_profile`
- `projects`
- `certifications`
- `contact_messages`
- `portfolio_admins`
- `portfolio-media` Storage bucket
- Row Level Security policies

## 2. Add the Supabase browser credentials

Open `supabase-config.js` and replace:

```js
window.SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
```

Use the project's **Project URL** and **Publishable key** (or legacy `anon` key where applicable).

**Never put a `service_role` / secret key in this file.** The browser client is protected by RLS; service keys must remain server-side.

## 3. Open the website

For local testing, do not rely on `file://` if your browser blocks requests. Run a small local server from this folder, for example:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

## 4. Seed your existing portfolio

1. Click **Manage Portfolio**.
2. Sign in with the Supabase admin account.
3. Open **Certificates** or **Projects**.
4. Click **Seed Default Content** once.
5. Your existing `data.js` projects, certificates and profile details will be copied to Supabase.

The seed action does not delete existing records and skips matching project/certificate titles.

## 5. Add new projects anytime

Go to:

**Manage Portfolio → Projects → Add Project**

You can enter:

- Project title
- Technologies
- Description
- GitHub URL
- Live demo URL
- Overview
- Problem statement
- Data preparation
- Analysis
- Key insights
- Outcome
- Dashboard/project screenshot

Click **Add Project**. The record is stored in PostgreSQL and the image is stored in Supabase Storage.

## 6. Add certificates anytime

Go to:

**Manage Portfolio → Certificates → Add Certificate**

Enter:

- Certificate title
- Issuing organization
- Year
- Credential URL
- JPG/PNG/PDF certificate

Click **Add Certificate**.

## 7. Update profile / resume

Go to:

**Manage Portfolio → Profile**

You can update:

- Name
- Role
- Tagline
- Location
- Phone
- Email
- LinkedIn
- GitHub
- Portfolio URL
- Profile photo
- Resume PDF

## 8. Deploy

This is a static frontend, so you can deploy it to GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc. The frontend connects directly to Supabase using the browser client and RLS.

After deployment, add your production site URL to **Supabase Authentication → URL Configuration** if you use hosted authentication flows.

## Security model

Public visitors can `SELECT` portfolio profile, projects and certificates.

Only users listed in `portfolio_admins` can:

- insert/update/delete projects
- insert/update/delete certificates
- update profile
- upload/update/delete portfolio files
- read/delete contact messages

The `contact_messages` table allows public inserts so visitors can submit the contact form.

## Important

`supabase-config.js` contains a publishable/anon client key. That key is not a database password. Security comes from Supabase Auth + PostgreSQL RLS + Storage policies.

Never expose:

- `service_role` key
- database password
- private server credentials

For a larger production system, add server-side validation, rate limiting/CAPTCHA for contact submissions, and optional email notifications.

---

## 👨‍💻 Made With ❤️ By

### **Manish Singh**

**Data Analyst | Python Developer | Power BI Enthusiast**

📊 Turning data into meaningful insights  
💻 Building practical and impactful projects  
🚀 Always learning, building, and improving

---

⭐ **If you like this project, consider giving it a star!**

© 2026 **Manish Singh**. All Rights Reserved.
