import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { withAuth, type AuthenticatedRequest } from '@/lib/api-guard';
import User from '@/models/User';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { sanitizeUser } from '@/lib/utils';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// POST /api/users/me/avatar — upload profile picture to Cloudinary
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data' },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
  }

  const file = formData.get('avatar');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No avatar file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File must be JPEG, PNG, WebP, or GIF' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await uploadToCloudinary(buffer, {
    folder: 'alalai/avatars',
    publicId: `user-${req.session.user.id}`,
  });

  await connectDB();

  const user = await User.findByIdAndUpdate(
    req.session.user.id,
    { $set: { profilePictureUrl: url } },
    { new: true }
  ).lean();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ profilePictureUrl: url, user: sanitizeUser(user) });
});
