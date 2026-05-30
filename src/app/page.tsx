import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function LandingPage() {
  // Redirect authenticated users straight to their dashboard
  const session = await auth();
  if (session?.user?.role === 'patient') redirect('/dashboard');
  if (session?.user?.role === 'doctor') redirect('/doctor/dashboard');

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl tracking-tight"><span className="text-gray-900">Alal</span><span className="text-primary">AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/register" />}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          Telehealth Platform
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mb-6">
          Healthcare at Your{' '}
          <span className="text-primary">Fingertips</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          Connect with qualified doctors, book consultations, and manage your health records — all
          in one secure platform designed for the modern patient.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" render={<Link href="/register?role=patient" />}>
            Book a Consultation
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/register?role=doctor" />}>
            Join as a Doctor
          </Button>
        </div>
      </section>

      {/* Role Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <h2 className="text-2xl font-bold text-center mb-10">How <span className="text-gray-900">Alal</span><span className="text-primary">AI</span> Works</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Patient Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <span className="text-2xl" role="img" aria-label="stethoscope">
                  🩺
                </span>
              </div>
              <CardTitle>For Patients</CardTitle>
              <CardDescription>
                Find the right doctor and get the care you need, when you need it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Browse doctors by specialization',
                  'Book and manage appointments online',
                  'Join virtual consultation sessions',
                  'Access medical records and prescriptions',
                  'AI-powered doctor recommendations',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-primary font-semibold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6"
                render={<Link href="/register?role=patient" />}
              >
                Create Patient Account
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-2">
                <span className="text-2xl" role="img" aria-label="doctor">
                  👨‍⚕️
                </span>
              </div>
              <CardTitle>For Doctors</CardTitle>
              <CardDescription>
                Manage your practice, connect with patients, and deliver care efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Set your availability and schedule',
                  'Conduct virtual consultations',
                  'Write notes and prescriptions',
                  'Access patient medical history',
                  'Real-time appointment notifications',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-primary font-semibold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full mt-6"
                variant="outline"
                render={<Link href="/register?role=doctor" />}
              >
                Join as a Doctor
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 <span className="text-gray-900 font-medium">Alal</span><span className="text-primary font-medium">AI</span>. Built for the Whitecloak Launchpad Program.</p>
      </footer>
    </main>
  );
}
