'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Plus, AlertCircle } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { registerDoctorSchema } from '@/lib/validations/auth';
import type { z } from 'zod';

type DoctorFormValues = z.input<typeof registerDoctorSchema>;

const SPECIALIZATION_SUGGESTIONS = [
  'General Practice',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Psychiatry',
  'Ophthalmology',
  'ENT',
  'Surgery',
];

export function DoctorRegisterForm() {
  const router = useRouter();
  const [specInput, setSpecInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(registerDoctorSchema),
    defaultValues: {
      role: 'doctor',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      licenseNumber: '',
      specialization: [],
      yearsOfExperience: 0,
    },
  });

  const specializations = (useWatch({ control: form.control, name: 'specialization' }) ?? []) as string[];

  function addSpecialization(value: string) {
    const trimmed = value.trim();
    if (!trimmed || specializations.includes(trimmed)) return;
    form.setValue('specialization', [...specializations, trimmed]);
    setSpecInput('');
  }

  function removeSpecialization(spec: string) {
    form.setValue(
      'specialization',
      specializations.filter((s) => s !== spec)
    );
  }

  async function onSubmit(values: DoctorFormValues) {
    setFormError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        if (res.status === 409) {
          form.setError('email', { message: 'An account with this email already exists.' });
          return;
        }
        setFormError(data.error ?? 'Registration failed. Please try again.');
        return;
      }

      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setFormError('Account created but sign-in failed. Please go to the login page.');
        return;
      }

      toast.success('Welcome to AlalAI!');
      router.push('/doctor/dashboard');
      router.refresh();
    } catch {
      setFormError('Something went wrong. Please check your connection and try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. Maria Santos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="doctor@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PRC License No.</FormLabel>
                <FormControl>
                  <Input placeholder="0123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="yearsOfExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Exp.</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Specialization multi-select */}
        <FormField
          control={form.control}
          name="specialization"
          render={() => (
            <FormItem>
              <FormLabel>Specialization(s)</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {specializations.map((spec) => (
                  <Badge key={spec} variant="secondary" className="gap-1">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${spec}`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  list="spec-suggestions"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialization(specInput);
                    }
                  }}
                  placeholder="Add specialization…"
                />
                <datalist id="spec-suggestions">
                  {SPECIALIZATION_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addSpecialization(specInput)}
                  aria-label="Add specialization"
                >
                  <Plus size={16} />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating account…' : 'Create Doctor Account'}
        </Button>
      </form>
    </Form>
  );
}
