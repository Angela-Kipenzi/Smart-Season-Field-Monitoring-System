import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import AdminDashboard from "./dashboard/admin";
import AgentDashboard from "./dashboard/agent";

export default function DashboardPage() {
  const { data, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  if (data?.user.role === "admin") {
    return <AdminDashboard />;
  }
  return <AgentDashboard />;
}
