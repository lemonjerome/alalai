import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import DoctorProfile from '@/models/DoctorProfile';
import User from '@/models/User';
import Availability from '@/models/Availability';
import { getAvailableSlots } from '@/lib/availability-utils';
import { sanitizeUser } from '@/lib/utils';
import type { IDoctorProfileDocument } from '@/models/DoctorProfile';

const PAGE_SIZE = 12;

// GET /api/doctors — list/search/filter public doctor profiles
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search')?.trim();
  const specialization = searchParams.get('specialization')?.trim();
  const availableOn = searchParams.get('availableOn'); // ISO date string
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(PAGE_SIZE, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10));

  // Build DoctorProfile query
  const profileQuery: Record<string, unknown> = { isAcceptingPatients: true };

  if (search) {
    profileQuery.$text = { $search: search };
  }

  if (specialization) {
    profileQuery.specialization = {
      $elemMatch: { $regex: specialization, $options: 'i' },
    };
  }

  const skip = (page - 1) * limit;
  const [profiles, total] = await Promise.all([
    DoctorProfile.find(profileQuery)
      .sort(search ? { score: { $meta: 'textScore' } } : { rating: -1, reviewCount: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IDoctorProfileDocument[]>(),
    DoctorProfile.countDocuments(profileQuery),
  ]);

  if (profiles.length === 0) {
    return NextResponse.json({ doctors: [], total, page, pages: Math.ceil(total / limit) });
  }

  // Fetch associated users
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } })
    .select('-passwordHash')
    .lean();

  const userMap = new Map(users.map((u) => [String(u._id), sanitizeUser(u)]));

  // Optionally compute next available slot for a given date
  let availabilityDate: Date | null = null;
  if (availableOn) {
    const parsed = new Date(availableOn);
    if (!isNaN(parsed.getTime())) availabilityDate = parsed;
  }

  const doctors = await Promise.all(
    profiles.map(async (profile) => {
      const user = userMap.get(String(profile.userId));
      if (!user) return null;

      let nextAvailableSlot: string | null = null;
      if (availabilityDate) {
        const avails = await Availability.find({
          doctorId: profile._id,
          isActive: true,
        }).lean();

        const slots = getAvailableSlots(availabilityDate, avails, []);
        nextAvailableSlot = slots[0]?.startISO ?? null;
      }

      return { user, doctorProfile: profile, nextAvailableSlot };
    })
  );

  const filteredDoctors = doctors.filter(Boolean);

  return NextResponse.json({
    doctors: filteredDoctors,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
