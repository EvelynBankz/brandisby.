import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { businessService } from "@/server/businesses/business.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessSetupForm } from "./_components/business-setup-form";

export default async function BusinessOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const existingBusiness = await businessService.getBusinessForUser(user.id);
  if (existingBusiness) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>
            This becomes your storefront and dashboard identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessSetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
