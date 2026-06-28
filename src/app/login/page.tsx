import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  if (!env.authEnabled) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-sm pt-12">
      <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan kredensial untuk akses dashboard.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
