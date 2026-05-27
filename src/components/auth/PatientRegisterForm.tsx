'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { registerPatientSchema } from '@/lib/validations/auth';
import type { z } from 'zod';

// Use input type so react-hook-form can represent optional/unset fields pre-transform
type PatientFormValues = z.input<typeof registerPatientSchema>;

export function PatientRegisterForm() {
  const router = useRouter();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      role: 'patient',
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: PatientFormValues) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          form.setError('email', { message: 'Email already registered' });
          return;
        }
        toast.error((data as { error?: string }).error ?? 'Registration failed');
        return;
      }

      // Auto sign-in after successful registration
      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        toast.error('Account created but sign-in failed. Please log in manually.');
        router.push('/login');
        return;
      }

      toast.success('Welcome to AlalAI!');
      router.push('/patient/dashboard');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
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
                <Input placeholder="Juan dela Cruz" {...field} />
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
                <Input type="email" placeholder="you@example.com" {...field} />
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
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+63 912 345 6789" {...field} />
              </FormControl>
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
          {form.formState.isSubmitting ? 'Creating account…' : 'Create Patient Account'}
        </Button>
      </form>
    </Form>
  );
}
