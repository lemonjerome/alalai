'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { HealthInfoForm } from '@/components/profile/HealthInfoForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function PatientProfilePage() {
  const { data, isLoading } = useCurrentUser();

  const user = data?.user as Record<string, string> | undefined;
  const profile = data?.profile as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="flex justify-center mb-8">
        <AvatarUpload
          currentUrl={user?.profilePictureUrl}
          name={user?.name}
        />
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="health">Health Info</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your name and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm
                defaultValues={{
                  name: user?.name,
                  phone: user?.phone,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
              <CardDescription>
                This information helps your doctor provide better care
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthInfoForm
                defaultValues={profile as Parameters<typeof HealthInfoForm>[0]['defaultValues']}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
