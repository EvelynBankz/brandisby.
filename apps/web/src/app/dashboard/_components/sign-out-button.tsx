"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/auth/actions";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOutAction();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
