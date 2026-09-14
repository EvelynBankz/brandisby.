const MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
};

export function firebaseErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return MESSAGES[code] ?? "Something went wrong. Please try again.";
}
