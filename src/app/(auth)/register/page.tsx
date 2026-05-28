import type { Metadata } from 'next';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientRegisterForm } from '@/components/auth/PatientRegisterForm';
import { DoctorRegisterForm } from '@/components/auth/DoctorRegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <Card className="flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden">
      <CardHeader className="space-y-1 shrink-0">
        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Join AlalAI as a patient or doctor
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <Tabs defaultValue="patient">
          <TabsList className="grid w-full grid-cols-2 h-10 mb-6">
            <TabsTrigger value="patient">I&apos;m a Patient</TabsTrigger>
            <TabsTrigger value="doctor">I&apos;m a Doctor</TabsTrigger>
          </TabsList>
          <TabsContent value="patient">
            <PatientRegisterForm />
          </TabsContent>
          <TabsContent value="doctor">
            <DoctorRegisterForm />
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
