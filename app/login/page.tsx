import { LoginForm } from "@/components/auth/login-form";
import { ToastProvider } from "@/components/ui/toast";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#FAF8F5] p-4 sm:p-6 md:p-8">
        <LoginForm initialError={error} />
      </div>
    </ToastProvider>
  );
}


