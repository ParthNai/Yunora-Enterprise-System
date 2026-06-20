import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-50 dark:from-orange-950/20 dark:via-background dark:to-amber-950/10 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="shadow-2xl border-0 ring-1 ring-border/50">
          <CardHeader className="space-y-4 text-center pb-6 pt-8">
            <div className="mx-auto w-28 bg-sidebar p-4 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/yunora-logo.png" alt="Yunora" className="h-10 w-auto" onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
              <CardDescription className="text-sm">Sign in to manage Yunora Furnishings</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            {login.error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{(login.error as Error).message}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@yunora.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={login.isPending}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={login.isPending}
                    required
                    autoComplete="current-password"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold mt-2 gap-2"
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured with encrypted sessions · Yunora ERP v2.0</span>
        </div>
      </div>
    </div>
  );
}
