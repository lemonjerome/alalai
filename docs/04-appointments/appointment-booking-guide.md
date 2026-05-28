# Appointment Booking — User Guide

## Who This Is For
Patients who want to book, reschedule, or cancel appointments; doctors who want to view their schedule and mark appointments complete.

---

## Booking a Consultation (Patient)

### From the Doctor Detail Page
1. Navigate to **Find Doctors** and select a doctor
2. Scroll to the **Book a Consultation** section
3. Click a highlighted date on the calendar — grey dates have no availability
4. Click a time slot button to select your preferred time
5. Review the booking summary and click **Confirm Booking**
6. You receive a confirmation message and are redirected to your appointments list

### From the Booking Page Directly
Navigate to `/book/[doctorId]` — the 3-step wizard walks you through:
- **Step 1 — Choose Date**: calendar highlighting available days
- **Step 2 — Pick Time**: available slot buttons for the selected day
- **Step 3 — Confirm**: summary card with doctor, date, time, and duration

---

## Your Appointments List

From the sidebar, click **Appointments**. Your appointments are organized in three tabs:

| Tab | What's shown |
|---|---|
| **Upcoming** | All pending and confirmed future appointments |
| **Completed** | Past appointments marked as completed |
| **Cancelled** | Appointments that were cancelled by you or the doctor |

Each appointment card shows:
- Doctor's name
- Date, time, and duration
- Status badge (pending / confirmed / completed / cancelled)
- Cancellation reason (if applicable)

---

## Joining a Consultation

The **Join** button on an appointment card becomes active **±15 minutes** before and after the scheduled time. Outside this window, the button is dimmed and cannot be clicked.

Click **Join** to open the Jitsi Meet consultation room in a new tab.

---

## Cancelling an Appointment

On any upcoming appointment card, click **Cancel**. A dialog asks for a cancellation reason (minimum 5 characters). The reason is logged and visible to both parties.

Cancellation is available for `pending` and `confirmed` appointments. Completed appointments cannot be cancelled.

---

## Doctor: Appointment Management

From the sidebar, click **Appointments**. Tabs:
- **Upcoming** — confirmed appointments
- **Pending** — appointments awaiting your confirmation (auto-confirmed in current version)
- **Completed** — past sessions
- **Cancelled** — cancelled appointments

### Marking an Appointment Complete
On a confirmed appointment card, click **Complete**. This moves the appointment to the Completed tab and allows the patient to view their medical record.

### Cancelling (Doctor)
Same cancel flow as patient — provide a reason and confirm.

---

## Status Definitions

| Status | Meaning |
|---|---|
| **pending** | Appointment created, awaiting system or doctor confirmation |
| **confirmed** | Appointment is set — both parties should plan to attend |
| **cancelled** | Appointment was cancelled by patient or doctor |
| **completed** | Session occurred and doctor marked it done |
| **no_show** | Patient did not attend (set by doctor if applicable) |
