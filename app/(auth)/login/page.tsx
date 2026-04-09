import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">ASHA Admin</CardTitle>
          <CardDescription>
            Acceso para administradoras y operadoras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Cargando...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
