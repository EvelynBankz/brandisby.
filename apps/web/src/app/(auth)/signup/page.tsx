import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "../_components/auth-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your Brandisby account</CardTitle>
          <CardDescription>Build your business your way.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AuthForm mode="signup" />
          <p className="text-center text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
