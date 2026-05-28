# Doctor Profile & Availability — User Guide

## Who This Is For
Doctors (users who registered with the "Doctor" role). This guide explains how to set up and manage your professional profile and weekly availability so patients can discover and book consultations with you.

---

## What Is a Doctor Profile?
Your doctor profile is the public-facing page patients see when browsing for a specialist. It shows your name, specializations, bio, education history, years of experience, and consultation fee. A complete profile builds trust and makes you easier to find through search.

---

## Filling In Your Profile

Navigate to **Profile** in the left sidebar.

| Field | What to Enter |
|---|---|
| **Name** | Your full professional name (Dr. Maria Santos) |
| **Phone** | Contact number (optional, not shown publicly) |
| **License Number** | PRC license number or equivalent credential |
| **Specialization** | One or more medical specializations (e.g., Cardiology, General Medicine) |
| **Bio** | A short paragraph about your practice and approach to patient care |
| **Education** | List your degrees and institutions, one per entry |
| **Years of Experience** | Numeric count of years in practice |
| **Consultation Fee** | Your fee in Philippine Peso |
| **Accepting Patients** | Toggle on/off — when off, you won't appear in patient search results |

Click **Save** to update any of these fields. Changes take effect immediately.

---

## Setting Your Weekly Availability

Availability slots define *when* patients can book appointments with you. Each slot represents a recurring block of time on a particular day of the week.

### Adding a Slot

1. Go to **Profile → Availability** tab
2. Click **Add Availability Slot**
3. Fill in:
   - **Day of Week** — Monday through Sunday
   - **Start Time** — e.g., `09:00`
   - **End Time** — e.g., `12:00`
   - **Slot Duration** — how long each appointment is (15, 30, 60, or 120 minutes). A 3-hour window with 60-minute slots creates three bookable slots.
4. Click **Save**

> **Overlap protection**: You cannot create two active slots that overlap on the same day. If a conflict is detected, you'll see an error asking you to adjust the times.

### Editing or Deleting a Slot

Each saved slot has an **Edit** and **Delete** button. Deleting a slot removes it permanently — existing appointments for that slot are not affected.

### Blocking Specific Dates

If you have a holiday, conference, or planned leave, you can block individual dates from an existing slot. Blocked dates appear highlighted in the patient's booking calendar. Patients cannot book on blocked dates even if your weekly schedule shows availability.

---

## How Availability Becomes Bookable Slots

Behind the scenes, each availability record expands into individual time slots for a given date:
- A **09:00–12:00** record with **60-minute** slots generates three slots: `09:00–10:00`, `10:00–11:00`, `11:00–12:00`
- Slots that have already passed (their end time is in the past) are automatically hidden
- Slots that overlap with an existing confirmed or pending appointment are removed
- Slots on a blocked date are hidden entirely

This means a patient browsing your calendar only ever sees genuinely open, future, unbooked slots.

---

## Accepting Patients Toggle

The **Accepting Patients** toggle controls whether you appear in the patient discovery search. Turn it off when:
- You are on extended leave
- Your schedule is temporarily full
- Your account is being set up

When toggled off, your profile becomes hidden from search results. Existing appointments are not affected.

---

## Tips for a Strong Profile
- Upload a clear **profile photo** (via the Photo section) — profiles with photos receive more bookings
- Write a **bio** of 2–3 sentences explaining your specialization focus and patient approach
- Add all specializations — patients filter by specialty when searching
- Set a realistic consultation fee — it appears on your public card

---

## Need Help?
If a slot appears incorrectly or patients report not being able to book, verify that:
1. The slot is set to **Active**
2. The day of week matches the day patients are trying to book
3. The date is not in the blocked dates list
