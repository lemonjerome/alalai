/**
 * Seed script — creates / updates demo accounts for local / Atlas testing.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI in your .env.local (or set in environment).
 * Safe to run multiple times — upserts accounts so details stay current.
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
    address: { type: String, default: '' },
    maritalStatus: { type: String, default: '' },
    weight: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
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

async function upsertDoctor(
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
  // Upsert user
  const doctor = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      $set: {
        ...user,
        role: 'doctor',
        passwordHash: hash,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Upsert doctor profile
  const doctorProfile = await DoctorProfileModel.findOneAndUpdate(
    { userId: doctor._id },
    {
      $set: {
        userId: doctor._id,
        ...profile,
        rating: profile.rating ?? 0,
        reviewCount: profile.reviewCount ?? 0,
        isVerified: profile.isVerified ?? false,
        isAcceptingPatients: true,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  // Ensure weekday availability exists (skip if already seeded)
  const existingSlots = await AvailabilityModel.countDocuments({ doctorId: doctorProfile._id });
  if (existingSlots === 0) {
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
  }

  console.log(`Upserted doctor: ${user.email} → ${profile.specialization.join(', ')}`);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Add it to .env.local or your environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Remove the old "doctor@demo.com" placeholder if still present ──────────
  const oldGP = await UserModel.findOne({ email: 'doctor@demo.com' });
  if (oldGP) {
    const oldProfile = await DoctorProfileModel.findOne({ userId: oldGP._id });
    if (oldProfile) {
      await AvailabilityModel.deleteMany({ doctorId: oldProfile._id });
      await DoctorProfileModel.deleteOne({ _id: oldProfile._id });
    }
    await UserModel.deleteOne({ _id: oldGP._id });
    console.log('Removed legacy doctor@demo.com account');
  }

  // ── Demo Patient — Sofia Mendoza ───────────────────────────────────────────
  const patient = await UserModel.findOneAndUpdate(
    { email: 'patient@demo.com' },
    {
      $set: {
        email: 'patient@demo.com',
        name: 'Sofia Mendoza',
        role: 'patient',
        phone: '+63 917 845 2310',
        passwordHash: hash,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  await PatientProfileModel.findOneAndUpdate(
    { userId: patient._id },
    {
      $set: {
        userId: patient._id,
        dateOfBirth: new Date('1995-03-14'),
        bloodType: 'O+',
        weight: 58,
        height: 162,
        allergies: ['Penicillin', 'Shellfish'],
        currentMedications: ['Cetirizine 10mg'],
        medicalHistory: 'Mild asthma since childhood, managed with rescue inhaler as needed. No prior surgeries. Seasonal allergic rhinitis.',
        address: '47B Mabini St., Barangay Pinyahan, Quezon City, Metro Manila 1100',
        maritalStatus: 'Single',
        emergencyContact: {
          name: 'Ricardo Mendoza',
          phone: '+63 917 123 4567',
          relationship: 'Father',
        },
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
  console.log('Upserted patient: patient@demo.com → Sofia Mendoza');

  // ── General Practice — Dr. Roberto Dela Cruz ──────────────────────────────
  await upsertDoctor(
    hash,
    { email: 'general@demo.com', name: 'Roberto Dela Cruz', phone: '+63 912 000 0002' },
    {
      licenseNumber: 'PRC-GP-100421',
      specialization: ['General Practice'],
      bio: 'Family physician with over a decade of experience in primary care and preventive medicine. Known for thorough consultations and a patient-first approach to managing chronic and acute conditions.',
      education: [
        'MD, University of the Philippines College of Medicine, 2010',
        'Family Medicine Residency, Philippine General Hospital, 2014',
      ],
      yearsOfExperience: 11,
      consultationFee: 500,
      rating: 4.8,
      reviewCount: 42,
      isVerified: true,
    }
  );

  // ── Cardiology — Dr. Maria Santos ─────────────────────────────────────────
  await upsertDoctor(
    hash,
    { email: 'cardio@demo.com', name: 'Maria Santos', phone: '+63 912 000 0003' },
    {
      licenseNumber: 'PRC-CV-200814',
      specialization: ['Cardiology'],
      bio: 'Board-certified cardiologist with expertise in heart disease prevention, echocardiography, and cardiac rehabilitation. Dedicated to empowering patients through education and evidence-based care.',
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

  // ── Pediatrics — Dr. Juan dela Cruz ───────────────────────────────────────
  await upsertDoctor(
    hash,
    { email: 'peds@demo.com', name: 'Juan dela Cruz', phone: '+63 912 000 0004' },
    {
      licenseNumber: 'PRC-PD-300712',
      specialization: ['Pediatrics'],
      bio: 'Compassionate pediatrician caring for children from newborn through adolescence. Committed to supporting developmental milestones, vaccination schedules, and childhood wellness in partnership with families.',
      education: [
        'MD, University of Santo Tomas Faculty of Medicine and Surgery, 2012',
        "Pediatrics Residency, Philippine Children's Medical Center, 2016",
      ],
      yearsOfExperience: 12,
      consultationFee: 800,
      rating: 4.7,
      reviewCount: 63,
      isVerified: true,
    }
  );

  // ── Dermatology — Dr. Ana Reyes ────────────────────────────────────────────
  await upsertDoctor(
    hash,
    { email: 'derm@demo.com', name: 'Ana Reyes', phone: '+63 912 000 0005' },
    {
      licenseNumber: 'PRC-DM-401116',
      specialization: ['Dermatology'],
      bio: 'Dermatologist specializing in both medical and cosmetic skin conditions. Experienced in treating acne, eczema, psoriasis, and performing skin cancer screenings with a focus on long-term skin health.',
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

  // ── Mental Health — Dr. Carlo Bautista ────────────────────────────────────
  await upsertDoctor(
    hash,
    { email: 'psych@demo.com', name: 'Carlo Bautista', phone: '+63 912 000 0006' },
    {
      licenseNumber: 'PRC-PS-500914',
      specialization: ['Mental Health'],
      bio: 'Psychiatrist and mental health advocate specializing in anxiety, depression, PTSD, and mood disorders. Provides evidence-based therapy and medication management in a safe, non-judgmental environment.',
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

  console.log('\n─────────────────────────────────────────────────');
  console.log('Demo accounts ready:');
  console.log('  Patient (Sofia Mendoza)        →  patient@demo.com');
  console.log('  General Practice (Roberto DC)  →  general@demo.com');
  console.log('  Cardiology (Maria Santos)       →  cardio@demo.com');
  console.log('  Pediatrics (Juan dela Cruz)     →  peds@demo.com');
  console.log('  Dermatology (Ana Reyes)         →  derm@demo.com');
  console.log('  Mental Health (Carlo Bautista)  →  psych@demo.com');
  console.log(`  Password (all accounts)         →  ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
