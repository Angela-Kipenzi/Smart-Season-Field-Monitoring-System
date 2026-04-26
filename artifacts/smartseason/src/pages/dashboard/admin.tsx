import MainLayout from "@/components/layout/main-layout";
import {
  useGetDashboardSummary,
  getGetDashboardSummaryQueryKey,
  Stage,
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Sprout, AlertTriangle, CheckCircle2, Activity, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const STAGE_COLORS: Record<string, string> = {
  [Stage.planted]: "hsl(200 80% 50%)",
  [Stage.growing]: "hsl(45 93% 47%)",
  [Stage.ready]: "hsl(142 45% 35%)",
  [Stage.harvested]: "hsl(280 65% 60%)",
};

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

  const chartData =
    summary?.stageBreakdown.map((item) => ({
      name: item.stage.charAt(0).toUpperCase() + item.stage.slice(1),
      count: item.count,
      stage: item.stage,
    })) || [];

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div>
          <Badge variant="outline" className="mb-2 bg-primary/5 text-primary border-primary/20">Coordinator view</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operations dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Org-wide visibility across every field, every agent, and every recent update.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-total-fields">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Fields</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{summary?.totalFields || 0}</div>}
            </CardContent>
          </Card>
          <Card data-testid="stat-active">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">{summary?.activeCount || 0}</div>}
            </CardContent>
          </Card>
          <Card data-testid="stat-at-risk">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{summary?.atRiskCount || 0}</div>}
            </CardContent>
          </Card>
          <Card data-testid="stat-completed">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">{summary?.completedCount || 0}</div>}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/40 border-dashed" data-testid="stat-total-agents">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Field Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{summary?.totalAgents || 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Manage them on the <Link href="/agents" className="underline hover:text-foreground">Agents page</Link>.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Crop Stages</CardTitle>
              <CardDescription>Distribution of every field by current growth stage</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={STAGE_COLORS[entry.stage] || "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  <Sprout className="h-10 w-10 mb-4 opacity-50" />
                  <p>No field data available.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>Latest activity from the field</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[400px] pr-2">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : summary?.recentUpdates && summary.recentUpdates.length > 0 ? (
                <ul className="space-y-4" data-testid="list-recent-updates">
                  {summary.recentUpdates.map((u) => (
                    <li key={u.id} className="flex gap-3" data-testid={`update-${u.id}`}>
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {u.newStage ? <Sprout className="h-4 w-4 text-primary" /> : <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/fields/${u.fieldId}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
                            {u.fieldName}
                          </Link>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {new Date(u.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {u.newStage && (
                          <Badge variant="outline" className="bg-primary/5 text-primary text-xs font-normal mt-1">
                            Stage → {u.newStage}
                          </Badge>
                        )}
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">"{u.note}"</p>
                        <p className="text-xs text-muted-foreground mt-1">By {u.authorName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                  <Clock className="h-6 w-6 opacity-50 mb-3" />
                  <p className="font-medium text-foreground">No recent updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
