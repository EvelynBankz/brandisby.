import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
        Brandisby
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Build your business your way.
      </h1>
      <p className="max-w-md text-base text-foreground-muted">
        The Brandisby platform is under active development. This page will
        become the marketing site as the website builder and Smart Product
        Builder milestones land.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </main>
  );
}
