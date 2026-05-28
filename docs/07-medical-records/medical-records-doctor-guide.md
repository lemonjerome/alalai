# Medical Records — Doctor Guide

## Overview
After a consultation, doctors create a structured medical record that captures the patient's diagnosis, consultation notes, and prescriptions. Patients receive a notification as soon as the record is published and can view it at any time from their Medical Records section.

---

## When to Add a Record

Medical records are tied to individual appointments. A record can be created:
- **During the consultation** — from the consultation sidebar's "Add Notes" button
- **After the session** — by navigating to **Records** in the doctor sidebar and selecting the appointment

You can only create one record per appointment. If a record already exists, you'll see an edit form instead.

---

## Creating a Consultation Record

### Step 1 — Open the Record Form
From the **Records** page, find the completed appointment in your list. Click **Add Notes** or **View Record** on the relevant appointment.

### Step 2 — Fill in Consultation Notes
**Consultation Notes** — A free-text field for your clinical observations, patient-reported symptoms, physical exam findings, and the course of the consultation. Write as much detail as needed; this is the doctor's subjective and objective assessment.

**Diagnosis** — The final diagnosis or working diagnosis (e.g., "Upper respiratory tract infection, viral" or "Hypertension Stage 1"). Keep this precise — it appears in the patient's record summary.

**Follow-Up Date** — Optional. Set a recommended follow-up date if the patient needs to return for a check-up. Patients will see this in their record and can use it to book a future appointment.

### Step 3 — Add Prescriptions
Click **Add Prescription** to add a medication row. Each prescription requires:

| Field | Description | Example |
|---|---|---|
| Medication | Drug name (generic or brand) | Amoxicillin 500mg |
| Dosage | Amount per dose | 500mg |
| Frequency | How often | 3x daily |
| Duration | How long to take | 7 days |
| Instructions | Special notes | Take with food; complete the full course |

You can add multiple prescriptions (e.g., antibiotic + decongestant). Remove any row with the trash icon.

### Step 4 — Submit
Click **Save Record**. The record is saved immediately and the patient receives a "Medical Record Available" notification.

---

## Editing a Record

Records can be edited within **72 hours** of creation. After that window, the record becomes read-only.

To edit:
1. Go to **Records** → find the appointment → click **Edit Record**
2. Update any field — changes are saved on submit
3. Prescriptions can be added, removed, or modified within the edit window

> **Why 72 hours?** This window gives doctors enough time to correct typos or add missed items after the consultation, while ensuring records are finalized promptly and patients can rely on their contents.

---

## Viewing Your Patients

The **Patients** tab in the doctor sidebar shows a list of all unique patients who have had at least one non-cancelled appointment with you. Click any patient to view their appointment history and associated records.

---

## Records Page Layout

The **Records** page lists all medical records you've created, sorted newest first. Each row shows:
- Patient name and avatar
- Appointment date
- Diagnosis (truncated)
- Status: **Editable** (within 72h) or **Locked** (after 72h)

Click a row to open the full record view.

---

## What Patients See

Once a record is published, patients can:
- Read consultation notes and diagnosis
- View all prescriptions in a formatted card
- See the follow-up date
- Print the prescription card (includes doctor name, license, patient name, date)

Patients **cannot** edit any part of the record.

---

## Edge Cases

- **Cancelled appointments** — Records cannot be created for cancelled appointments; the form will show an error
- **Duplicate records** — Only one record per appointment is allowed; attempting to create a second returns a conflict error
- **72h window expired** — The edit form is disabled; you'll see a "Record is locked" notice with the lock timestamp
