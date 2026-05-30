/**
 * Seed script — creates demo accounts for local / Atlas testing.
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
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEMO_PASSWORD = 'Demo1234!';
const WEEKDAYS = [1, 2, 3, 4, 5];

async function createDoctor(
  hash: string,
  user: { email: string; name: string; phone: string },
  profile: {
    licenseNumber: string;
    specialization: string[];
    bio: string;
    education: string[];
    yearsOfExperience: number;
    consultationFee: number;
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
  }
) {
  let doctor = await UserModel.findOne({ email: user.email });
  if (doctor) {
    console.log(`Doctor already exists: ${user.email}`);
    return;
  }
  doctor = await UserModel.create({ ...user, role: 'doctor', passwordHash: hash });
  const doctorProfile = await DoctorProfileModel.create({
    userId: doctor._id,
    ...profile,
    rating: profile.rating ?? 0,
    reviewCount: profile.reviewCount ?? 0,
    isVerified: profile.isVerified ?? false,
    isAcceptingPatients: true,
  });
  await AvailabilityModel.insertMany(
    WEEKDAYS.map((day) => ({
      doctorId: doctorProfile._id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
      isActive: true,
      blockedDates: [],
    }))
  );
  console.log(`Created doctor: ${user.email} → ${profile.specialization.join(', ')}`);
}

// ── Seed data ─────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to .env.local or your environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Demo Patient ───────────────────────────────────────────────────────────
  let patient = await UserModel.findOne({ email: 'patient@demo.com' });
  if (patient) {
    console.log('Patient already exists: patient@demo.com');
  } else {
    patient = await UserModel.create({
      email: 'patient@demo.com',
      name: 'Demo Patient',
      role: 'patient',
      phone: '+63 912 000 0001',
      passwordHash: hash,
    });
    await PatientProfileModel.create({ userId: patient._id });
    console.log('Created patient: patient@demo.com');
  }

  // ── Demo Doctor — General Practitioner ────────────────────────────────────
  await createDoctor(
    hash,
    { email: 'doctor@demo.com', name: 'Demo Doctor', phone: '+63 912 000 0002' },
    {
      licenseNumber: 'PRC-0000001',
      specialization: ['General Practitioner'],
      bio: 'Demo doctor account for testing the AlalAI telehealth platform. Provides comprehensive primary care and routine check-ups.',
      education: ['MD, University of the Philippines, 2010', 'Internal Medicine Residency, PGH, 2014'],
      yearsOfExperience: 10,
      consultationFee: 500,
      rating: 4.8,
      reviewCount: 42,
      isVerified: true,
    }
  );

  // ── Cardiology ────────────────────────────────────────────────────────────
  await createDoctor(
    hash,
    { email: 'cardio@demo.com', name: 'Maria Santos', phone: '+63 912 000 0003' },
    {
      licenseNumber: 'PRC-0000002',
      specialization: ['Cardiology'],
      bio: 'Board-certified cardiologist specializing in heart disease prevention and management. Experienced in ECG interpretation, echocardiography, and cardiac rehabilitation.',
      education: [
        'MD, De La Salle Medical and Health Sciences Institute, 2008',
        'Cardiology Fellowship, Philippine Heart Center, 2015',
      ],
      yearsOfExperience: 16,
      consultationFee: 1200,
      rating: 4.9,
      reviewCount: 87,
      isVerified: true,
    }
  );

  // ── Pediatrics ────────────────────────────────────────────────────────────
  await createDoctor(
    hash,
    { email: 'peds@demo.com', name: 'Juan dela Cruz', phone: '+63 912 000 0004' },
    {
      licenseNumber: 'PRC-0000003',
      specialization: ['Pediatrics'],
      bio: 'Compassionate pediatrician caring for children from newborn to adolescence. Expertise in developmental milestones, vaccinations, and childhood illness management.',
      education: [
        'MD, University of Santo Tomas, 2012',
        'Pediatrics Residency, Philippine Children\'s Medical Center, 2016',
      ],
      yearsOfExperience: 12,
      consultationFee: 800,
      rating: 4.7,
      reviewCount: 63,
      isVerified: true,
    }
  );

  // ── Dermatology ───────────────────────────────────────────────────────────
  await createDoctor(
    hash,
    { email: 'derm@demo.com', name: 'Ana Reyes', phone: '+63 912 000 0005' },
    {
      licenseNumber: 'PRC-0000004',
      specialization: ['Dermatology'],
      bio: 'Dermatologist specializing in medical and cosmetic skin conditions. Expertise in acne, eczema, psoriasis, skin cancer screening, and aesthetic dermatology.',
      education: [
        'MD, Ateneo School of Medicine and Public Health, 2011',
        'Dermatology Residency, Research Institute for Tropical Medicine, 2016',
      ],
      yearsOfExperience: 13,
      consultationFee: 900,
      rating: 4.6,
      reviewCount: 55,
      isVerified: true,
    }
  );

  // ── Mental Health ─────────────────────────────────────────────────────────
  await createDoctor(
    hash,
    { email: 'psych@demo.com', name: 'Carlo Bautista', phone: '+63 912 000 0006' },
    {
      licenseNumber: 'PRC-0000005',
      specialization: ['Mental Health'],
      bio: 'Psychiatrist and mental health advocate specializing in anxiety, depression, PTSD, and mood disorders. Offers evidence-based therapy and medication management in a safe, non-judgmental space.',
      education: [
        'MD, Far Eastern University – Nicanor Reyes Medical Foundation, 2009',
        'Psychiatry Residency, National Center for Mental Health, 2014',
      ],
      yearsOfExperience: 15,
      consultationFee: 1000,
      rating: 4.9,
      reviewCount: 71,
      isVerified: true,
    }
  );

  console.log('\n─────────────────────────────────────');
  console.log('Demo accounts ready:');
  console.log('  Patient      →  patient@demo.com');
  console.log('  Doctor (GP)  →  doctor@demo.com');
  console.log('  Cardiologist →  cardio@demo.com');
  console.log('  Pediatrician →  peds@demo.com');
  console.log('  Dermatologist→  derm@demo.com');
  console.log('  Psychiatrist →  psych@demo.com');
  console.log(`  Password     →  ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
