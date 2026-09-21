import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-10">
      <SignUp appearance={{ elements: { rootBox: "w-full max-w-md", card: "shadow-card" } }} />
    </main>
  );
}