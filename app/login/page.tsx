import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Application OS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track applications, documents, and capital in one place.
        </p>
      </div>

      {error ? (
        <p className="mb-4 max-w-md text-center text-sm text-destructive">
          Sign-in failed. Request a new magic link and try again.
        </p>
      ) : null}

      <LoginForm />
    </div>
  );
}
