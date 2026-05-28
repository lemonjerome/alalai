/**
 * Seed script — creates two demo accounts for local testing.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI in your .env.local (or set in environment).
 * Safe to run multiple times — skips accounts that already exist.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ── Inline mini-models (avoids @/ path alias resolution issues in scripts) ────

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor'], required: true },
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    profilePictureUrl: { type: String, default: '' },
  },
  { timestamps: true, collection: 'users' }
);

const PatientProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    dateOfBirth: Date,
    bloodType: String,
    allergies: [String],
    currentMedications: [String],
    medicalHistory: String,
  },
  { timestamps: true, collection: 'patient_profiles' }
);

const DoctorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    licenseNumber: { type: String, default: '' },
    specialization: [String],
    bio: { type: String, default: '' },
    education: [String],
    yearsOfExperience: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isAcceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'doctor_profiles' }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDurationMinutes: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
    blockedDates: [Date],
  },
  { timestamps: true, collection: 'availabilities' }
);

const UserModel = mongoose.models.User ?? mongoose.model('User', UserSchema);
const PatientProfileModel = mongoose.models.PatientProfile ?? mongoose.model('PatientProfile', PatientProfileSchema);
const DoctorProfileModel = mongoose.models.DoctorProfile ?? mongoose.model('DoctorProfile', DoctorProfileSchema);
const AvailabilityModel = mongoose.models.Availability ?? mongoose.model('Availability', AvailabilitySchema);

// ── Seed data ─────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'Demo1234!';

const DEMO_PATIENT = {
  email: 'patient@demo.com',
  name: 'Demo Patient',
  role: 'patient' as const,
  phone: '+63 912 000 0001',
};

const DEMO_DOCTOR = {
  email: 'doctor@demo.com',
  name: 'Dr. Demo Doctor',
  role: 'doctor' as const,
  phone: '+63 912 000 0002',
  licenseNumber: 'PRC-0000001',
  specialization: ['General Practice', 'Internal Medicine'],
  bio: 'Demo doctor account for testing the AlalAI telehealth platform.',
  education: ['MD, University of the Philippines, 2010', 'Internal Medicine Residency, PGH, 2014'],
  yearsOfExperience: 10,
  consultationFee: 500,
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to .env.local or your environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Patient ────────────────────────────────────────────────────────────────
  let patient = await UserModel.findOne({ email: DEMO_PATIENT.email });
  if (patient) {
    console.log(`Patient already exists: ${DEMO_PATIENT.email}`);
  } else {
    patient = await UserModel.create({ ...DEMO_PATIENT, passwordHash: hash });
    await PatientProfileModel.create({ userId: patient._id });
    console.log(`Created patient: ${DEMO_PATIENT.email}`);
  }

  // ── Doctor ─────────────────────────────────────────────────────────────────
  let doctor = await UserModel.findOne({ email: DEMO_DOCTOR.email });
  if (doctor) {
    console.log(`Doctor already exists: ${DEMO_DOCTOR.email}`);
  } else {
    doctor = await UserModel.create({ ...DEMO_DOCTOR, passwordHash: hash });
    const profile = await DoctorProfileModel.create({
      userId: doctor._id,
      licenseNumber: DEMO_DOCTOR.licenseNumber,
      specialization: DEMO_DOCTOR.specialization,
      bio: DEMO_DOCTOR.bio,
      education: DEMO_DOCTOR.education,
      yearsOfExperience: DEMO_DOCTOR.yearsOfExperience,
      consultationFee: DEMO_DOCTOR.consultationFee,
      isAcceptingPatients: true,
    });

    // Add Mon–Fri availability (9 AM – 5 PM, 30-min slots)
    const weekdays = [1, 2, 3, 4, 5];
    await AvailabilityModel.insertMany(
      weekdays.map((day) => ({
        doctorId: profile._id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slotDurationMinutes: 30,
        isActive: true,
        blockedDates: [],
      }))
    );
    console.log(`Created doctor: ${DEMO_DOCTOR.email} (with Mon–Fri availability)`);
  }

  console.log('\n─────────────────────────────────────');
  console.log('Demo accounts ready:');
  console.log(`  Patient  →  ${DEMO_PATIENT.email}`);
  console.log(`  Doctor   →  ${DEMO_DOCTOR.email}`);
  console.log(`  Password →  ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
