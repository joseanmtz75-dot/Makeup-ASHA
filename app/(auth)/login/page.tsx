import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">ASHA Admin</CardTitle>
          <CardDescription>Acceso para administradoras y operadoras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
            El formulario de login se construye en Fase 1 (paso 1: auth admin/operadora).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
