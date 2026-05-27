# Database — User Guide

## What is the database used for?
AlalAI uses MongoDB to store all persistent data — user accounts, doctor profiles, appointments, medical records, and notifications. You interact with it indirectly through the app's features; no direct database access is needed.

## How to set up MongoDB Atlas (free tier)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up or log in.
2. Create a **free M0 cluster** (choose any region close to your users — e.g., Singapore for Philippines).
3. In **Database Access**, create a database user with a username and strong password.
4. In **Network Access**, click "Add IP Address" → "Allow Access from Anywhere" (`0.0.0.0/0`). This is required for Vercel's dynamic IPs.
5. Click **Connect** on your cluster → **Drivers** → Copy the connection string.
6. Replace `<password>` in the string with your database user's password.
7. Add the string to your `.env.local` as `MONGODB_URI=<your-string>`.

## What data is stored?

| Collection | What it holds |
|---|---|
| `users` | All accounts — email, hashed password, name, role (patient or doctor) |
| `patient_profiles` | Health info — date of birth, weight, height, blood type, allergies, medications |
| `doctor_profiles` | Professional info — specialization, bio, license, fee, rating |
| `availabilities` | When doctors are available — day of week, start/end time, blocked dates |
| `appointments` | Bookings — who booked with whom, when, status (confirmed/cancelled/completed) |
| `medical_records` | Post-consultation notes and prescriptions added by doctors |
| `notifications` | In-app alerts — booking confirmations, reminders, cancellations |

## Data flow example
1. Patient registers → `users` + `patient_profiles` records created
2. Doctor sets availability → `availabilities` records created
3. Patient books appointment → `appointments` record created + `notifications` for both users
4. Doctor adds notes after consultation → `medical_records` record created + `notifications` for patient
