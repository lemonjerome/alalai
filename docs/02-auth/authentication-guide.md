# Authentication — User Guide

## Overview
AlalAI uses a simple email-and-password login system. There are two account types: **Patient** and **Doctor**. Each role sees a different dashboard and a different set of features. You choose your role when you register — it cannot be changed later.

## Registering an Account

### As a Patient
1. Go to `/register` and click the **Patient** tab.
2. Fill in your full name, email address, and a password.
3. Password requirements:
   - At least 8 characters
   - At least one uppercase letter
   - At least one number
4. Confirm your password and click **Create Account**.
5. You are automatically signed in and taken to your patient dashboard.

### As a Doctor
1. Go to `/register` and click the **Doctor** tab.
2. Fill in your full name, email, password (same requirements as above).
3. You must also provide:
   - **License Number** — your professional medical licence ID
   - **Specialization(s)** — you can add multiple (e.g. General Practice, Cardiology)
   - **Years of Experience** — optional, defaults to 0
4. Click **Create Account** to register and be taken to your doctor dashboard.

### Duplicate Emails
If you try to register with an email that already exists, you will see a `409 Conflict` error. Use a different email or go to the login page if you already have an account.

## Logging In
1. Go to `/login`.
2. Enter your registered email and password.
3. Click **Sign In**.
4. You are redirected to your role's dashboard:
   - Patients → `/patient/dashboard`
   - Doctors → `/doctor/dashboard`

## Accessing the Wrong Role's Area
The app automatically enforces role separation:
- If you are a **patient** and try to navigate to a doctor URL, you are redirected to your own dashboard.
- If you are a **doctor** and try to navigate to a patient URL, you are redirected to your doctor dashboard.
- Unauthenticated visitors who try to access any protected page are sent to `/login`. After logging in, you return to the page you were trying to reach.

## Session Persistence
Once logged in, your session is stored as a secure cookie and lasts **30 days**. You stay logged in across browser restarts without having to sign in again.

## Logging Out
Click your avatar or name in the top-right corner of any page and select **Sign Out**. Your session is cleared and you are returned to the landing page.

## Forgot Password
Password reset is not yet available in this version. Contact your system administrator if you need access to a locked account.

## Security Notes
- Passwords are **never stored in plain text** — they are one-way hashed before being saved.
- The app rate-limits registration attempts to prevent automated abuse (5 attempts per 10 minutes per IP).
- Your session token is stored in an HTTP-only cookie — it cannot be read by JavaScript in the browser.
