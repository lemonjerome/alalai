'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserSchema, updatePatientProfileSchema, MARITAL_STATUS_VALUES } from '@/lib/validations/user';
import { useUpdateUser, useUpdatePatientProfile } from '@/hooks/useCurrentUser';

// Combined schema for the personal info form
const personalInfoSchema = updateUserSchema.merge(
  updatePatientProfileSchema.pick({ address: true, maritalStatus: true }),
);

type FormValues = z.infer<typeof personalInfoSchema>;

const MARITAL_STATUS_LABELS: Record<string, string> = {
  Single: 'Single',
  Married: 'Married',
  Divorced: 'Divorced',
  Separated: 'Separated',
  'Civil Partnership': 'Civil Partnership',
};

interface PersonalInfoFormProps {
  defaultValues?: Partial<FormValues>;
}

export function PersonalInfoForm({ defaultValues }: PersonalInfoFormProps) {
  const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdatePatientProfile();
  const isPending = isUpdatingUser || isUpdatingProfile;

  const form = useForm<FormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      maritalStatus: defaultValues?.maritalStatus ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    const { name, phone, profilePictureUrl, address, maritalStatus } = values;

    // Fire both in parallel — they touch different collections
    await Promise.all([
      updateUser({ name, phone, profilePictureUrl }),
      updateProfile({ address, maritalStatus }),
    ]);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+63 912 345 6789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Rizal St., Barangay San Antonio, Manila"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maritalStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={(field.value as string) ?? ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Prefer not to say</SelectItem>
                  {MARITAL_STATUS_VALUES.filter((v) => v !== '').map((status) => (
                    <SelectItem key={status} value={status}>
                      {MARITAL_STATUS_LABELS[status] ?? status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
