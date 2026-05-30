import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientRegisterForm } from '@/components/auth/PatientRegisterForm';
import { DoctorRegisterForm } from '@/components/auth/DoctorRegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <div className="w-full space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <Tabs defaultValue="patient">
        <Card>
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Join <span className="text-gray-900 font-semibold">Alal</span><span className="text-primary font-semibold">AI</span> as a patient or doctor
            </CardDescription>
            <TabsList className="w-full">
              <TabsTrigger value="patient" className="flex-1">I&apos;m a Patient</TabsTrigger>
              <TabsTrigger value="doctor" className="flex-1">I&apos;m a Doctor</TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* Fixed min-height so both tabs occupy the same card size */}
          <CardContent className="min-h-[520px] flex flex-col">
            <div className="flex-1">
              <TabsContent value="patient" className="mt-0">
                <PatientRegisterForm />
              </TabsContent>
              <TabsContent value="doctor" className="mt-0">
                <DoctorRegisterForm />
              </TabsContent>
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
