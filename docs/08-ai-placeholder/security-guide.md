# Security — User Guide

## How AlalAI Protects Your Data

This page explains the security measures built into AlalAI so you can use the platform with confidence.

---

## Passwords

Your password is **never stored in readable form**. When you register, AlalAI converts your password into a scrambled hash using a strong algorithm (bcrypt). Even if someone accessed the database, they could not read your password.

What this means for you:
- If you forget your password, you cannot "recover" it — you must reset it (password reset is a planned feature)
- Always use a strong, unique password for AlalAI

---

## Sessions

When you log in, AlalAI creates a **session token** (a JWT — JSON Web Token) stored in a secure cookie. This token:
- Identifies who you are and what role you have (patient or doctor)
- Expires automatically (you'll be logged out after the session expires)
- Is transmitted only over HTTPS (encrypted in transit)

You can log out at any time using the **Sign Out** option in your profile menu.

---

## What Each Role Can See

AlalAI enforces strict access controls between patients and doctors:

| Data | Patient | Doctor |
|---|---|---|
| Own profile | ✅ View & edit | ✅ View & edit |
| Another user's profile | ❌ | ❌ |
| Own appointments | ✅ | ✅ (own doctor appointments) |
| Other patients' appointments | ❌ | ❌ |
| Own medical records | ✅ View | ✅ View & edit (72h window) |
| Other patients' records | ❌ | ❌ (only their own patients) |
| Doctor profiles | ✅ View (public info only) | ✅ Own profile only |

---

## Rate Limiting

AlalAI limits how many requests can be made in a short period to prevent abuse:
- **Registration / Login**: 5 attempts per 10 minutes per IP address
- **Booking appointments**: 10 bookings per minute per account
- **Creating medical records**: 10 records per minute per account

If you're rate-limited, you'll see a "Too many requests" error. Wait a minute and try again.

---

## HTTPS Only

AlalAI is deployed on Vercel, which enforces HTTPS on all connections. Your data is encrypted between your browser and our servers.

---

## Medical Record Privacy

- Your medical records are visible only to you and the doctor who created them
- Doctors cannot see records from appointments with other doctors
- Records cannot be deleted by patients or doctors — they are permanent to maintain medical integrity

---

## If Something Looks Wrong

If you notice unauthorized access, incorrect data in your records, or other security concerns, please contact us immediately through the platform's feedback channel.
