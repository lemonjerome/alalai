'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AvailabilityManager } from '@/components/doctors/AvailabilityManager';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2).trim().optional(),
  phone: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  specialization: z.string().trim(), // comma-separated
  bio: z.string().trim().optional(),
  education: z.string().trim(),       // newline-separated
  yearsOfExperience: z.coerce.number().int().min(0).optional(),
  consultationFee: z.coerce.number().min(0).optional(),
  isAcceptingPatients: z.boolean(),
});

type ProfileFormValues = z.input<typeof profileSchema>;

interface DoctorProfileData {
  user: { name: string; email: string; phone?: string; profilePictureUrl?: string };
  doctorProfile: {
    licenseNumber: string;
    specialization: string[];
    bio: string;
    education: string[];
    yearsOfExperience: number;
    consultationFee: number;
    isAcceptingPatients: boolean;
  };
}

async function fetchDoctorProfile(): Promise<DoctorProfileData> {
  const res = await fetch('/api/doctors/me/profile');
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json() as Promise<DoctorProfileData>;
}

async function updateDoctorProfile(body: Record<string, unknown>): Promise<DoctorProfileData> {
  const res = await fetch('/api/doctors/me/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json() as { error: string };
    throw new Error(err.error ?? 'Failed to update profile');
  }
  return res.json() as Promise<DoctorProfileData>;
}

export default function DoctorProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: fetchDoctorProfile,
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      licenseNumber: '',
      specialization: '',
      bio: '',
      education: '',
      yearsOfExperience: 0,
      consultationFee: 0,
      isAcceptingPatients: true,
    },
  });

  // useWatch is memoization-safe (unlike form.watch())
  const isAcceptingPatients = useWatch({ control: form.control, name: 'isAcceptingPatients' });

  // Populate form when data loads
  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.user.name,
      phone: data.user.phone ?? '',
      licenseNumber: data.doctorProfile.licenseNumber,
      specialization: data.doctorProfile.specialization.join(', '),
      bio: data.doctorProfile.bio,
      education: data.doctorProfile.education.join('\n'),
      yearsOfExperience: data.doctorProfile.yearsOfExperience,
      consultationFee: data.doctorProfile.consultationFee,
      isAcceptingPatients: data.doctorProfile.isAcceptingPatients,
    });
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const body = {
        name: values.name,
        phone: values.phone,
        licenseNumber: values.licenseNumber,
        specialization: values.specialization
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        bio: values.bio,
        education: values.education
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        yearsOfExperience: values.yearsOfExperience,
        consultationFee: values.consultationFee,
        isAcceptingPatients: values.isAcceptingPatients,
      };
      return updateDoctorProfile(body);
    },
    onSuccess: () => {
      toast.success('Profile updated');
      void queryClient.invalidateQueries({ queryKey: ['doctorProfile'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Update your professional information and availability</p>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...form.register('name')} placeholder="Dr. Maria Santos" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register('phone')} placeholder="+63 912 345 6789" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input id="licenseNumber" {...form.register('licenseNumber')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specializations</Label>
              <Input
                id="specialization"
                {...form.register('specialization')}
                placeholder="Cardiology, General Medicine"
              />
              <p className="text-xs text-gray-400">Separate multiple specializations with commas</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...form.register('bio')}
                rows={3}
                placeholder="Brief description of your practice and approach…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                {...form.register('education')}
                rows={3}
                placeholder="MD, University of Santo Tomas, 2010&#10;Cardiology Fellowship, PGH, 2013"
              />
              <p className="text-xs text-gray-400">One entry per line</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  min={0}
                  {...form.register('yearsOfExperience')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consultationFee">Consultation Fee (₱)</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  min={0}
                  {...form.register('consultationFee')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Accepting Patients</p>
                <p className="text-xs text-gray-500">
                  When off, your profile is hidden from patient search
                </p>
              </div>
              <Switch
                checked={isAcceptingPatients}
                onCheckedChange={(v: boolean) => form.setValue('isAcceptingPatients', v)}
              />
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Saving…' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Availability manager */}
      <AvailabilityManager />
    </div>
  );
}
