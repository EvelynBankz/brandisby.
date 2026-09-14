import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { businessService } from "@/server/businesses/business.service";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "./_components/sign-out-button";

// Minimal placeholder for M1.1 — real metrics (orders/revenue/customers)
// land once orders exist (Test Mode milestone 8).
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const business = await businessService.getBusinessForUser(user.id);
  if (!business) redirect("/onboarding/business");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <PageHeader
        title={business.name}
        description={`Signed in as ${user.email}`}
        actions={<SignOutButton />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your Brandisby link</CardTitle>
          <CardDescription>Share this once your website is published.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <code className="rounded-md bg-surface-muted px-3 py-1.5 text-sm text-foreground">
            {business.slug}.brandisby.com
          </code>
          <Badge variant="outline">Not published yet</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
