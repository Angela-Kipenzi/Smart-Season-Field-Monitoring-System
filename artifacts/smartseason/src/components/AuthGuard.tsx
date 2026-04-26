import { ReactNode } from "react";
import { useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { MailQuestion, LogOut, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

interface InfoScreenProps {
  icon: ReactNode;
  iconBg: string;
  title: string;
  message: string;
  primary?: { label: string; onClick: () => void; icon?: ReactNode };
  secondary?: { label: string; onClick: () => void; icon?: ReactNode };
  testId?: string;
}

function InfoScreen({
  icon,
  iconBg,
  title,
  message,
  primary,
  secondary,
  testId,
}: InfoScreenProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted/20 px-4"
      data-testid={testId}
    >
      <div className="max-w-md w-full bg-background border border-border rounded-2xl shadow-sm p-8 text-center">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 ${iconBg}`}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2">
          {primary && (
            <Button
              onClick={primary.onClick}
              className="w-full gap-2"
              data-testid="btn-guard-primary"
            >
              {primary.icon}
              {primary.label}
            </Button>
          )}
          {secondary && (
            <Button
              variant="outline"
              onClick={secondary.onClick}
              className="w-full gap-2"
              data-testid="btn-guard-secondary"
            >
              {secondary.icon}
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading your workspace…</p>
    </div>
  );
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { signOut } = useClerk();
  const { isLoading, error, refetch } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    const status = (error as { status?: number }).status;
    const data = (error as { data?: { error?: string; message?: string } })
      .data;

    // Account is signed in but has no invitation in the system
    if (status === 403 && data?.error === "no_invitation") {
      return (
        <InfoScreen
          testId="screen-not-invited"
          icon={<MailQuestion className="h-8 w-8 text-amber-600 dark:text-amber-400" />}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          title="Account not invited"
          message={
            data.message ??
            "Ask your coordinator to invite your email address before you can sign in."
          }
          secondary={{
            label: "Sign out",
            onClick: () => signOut(),
            icon: <LogOut className="h-4 w-4" />,
          }}
        />
      );
    }

    // Auth header / session not reaching the server
    if (status === 401) {
      return (
        <InfoScreen
          testId="screen-auth-error"
          icon={<AlertCircle className="h-8 w-8 text-destructive" />}
          iconBg="bg-destructive/10"
          title="Session not authenticated"
          message="Your sign-in session couldn't be verified. Please try again — you may need to sign out and back in."
          primary={{
            label: "Try again",
            onClick: () => refetch(),
            icon: <RefreshCw className="h-4 w-4" />,
          }}
          secondary={{
            label: "Sign out",
            onClick: () => signOut(),
            icon: <LogOut className="h-4 w-4" />,
          }}
        />
      );
    }

    // Generic server / network error
    return (
      <InfoScreen
        testId="screen-server-error"
        icon={<AlertCircle className="h-8 w-8 text-destructive" />}
        iconBg="bg-destructive/10"
        title="Something went wrong"
        message="We couldn't load your account. Please try again in a moment."
        primary={{
          label: "Try again",
          onClick: () => refetch(),
          icon: <RefreshCw className="h-4 w-4" />,
        }}
        secondary={{
          label: "Sign out",
          onClick: () => signOut(),
          icon: <LogOut className="h-4 w-4" />,
        }}
      />
    );
  }

  return <>{children}</>;
}
