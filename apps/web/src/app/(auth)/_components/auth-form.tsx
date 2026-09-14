"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { firebaseErrorMessage } from "@/lib/firebase-errors";
import { createSessionAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";

export interface AuthFormProps {
  mode: "signup" | "login";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const credential =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      const idToken = await credential.user.getIdToken();
      const result = await createSessionAction(idToken);

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(firebaseErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField label="Email" htmlFor="email" required>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FormField>
      <FormField label="Password" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>
      {error ? (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
