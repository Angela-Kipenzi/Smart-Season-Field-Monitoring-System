import MainLayout from "@/components/layout/main-layout";
import {
  useGetMe,
  getGetMeQueryKey,
  useListFields,
  getListFieldsQueryKey,
  useListRecentUpdates,
  getListRecentUpdatesQueryKey,
  Field,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant="secondary" className="capitalize text-xs">
      {stage}
    </Badge>
  );
}

export default function AgentDashboard() {
  const { data: meData } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });
  const { data: fields, isLoading: isLoadingFields } = useListFields({
    query: { queryKey: getListFieldsQueryKey() },
  });
  const { data: recent, isLoading: isLoadingRecent } = useListRecentUpdates({
    query: { queryKey: getListRecentUpdatesQueryKey() },
  });

  const me = meData?.user;
  const total = fields?.length ?? 0;
  const atRisk = fields?.filter((f) => f.status === "at_risk") ?? [];
  const active = fields?.filter((f) => f.status === "active") ?? [];
  const completed = fields?.filter((f) => f.status === "completed") ?? [];

  // Sort fields needing attention: at_risk first, then by lastUpdateAt asc (oldest first)
  const sortedNeedAttention = [...(fields ?? [])].sort((a, b) => {
    if (a.status === "at_risk" && b.status !== "at_risk") return -1;
    if (b.status === "at_risk" && a.status !== "at_risk") return 1;
    const aTime = a.lastUpdateAt ? new Date(a.lastUpdateAt).getTime() : 0;
    const bTime = b.lastUpdateAt ? new Date(b.lastUpdateAt).getTime() : 0;
    return aTime - bTime;
  });
  const focusList = sortedNeedAttention.slice(0, 5);

  return (
    <MainLayout>
      <div className="flex flex-col gap-8">
        <div>
          <Badge
            variant="outline"
            className="mb-2 bg-primary/5 text-primary border-primary/20"
          >
            Field Agent view
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {me ? `Good day, ${me.name.split(" ")[0]}.` : "Welcome back."}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here are the fields under your care today.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-my-fields">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">My Fields</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingFields ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{total}</div>
              )}
            </CardContent>
          </Card>
          <Card
            className={
              atRisk.length > 0
                ? "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/10"
                : ""
            }
            data-testid="stat-needs-attention"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Needs attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoadingFields ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                  {atRisk.length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card data-testid="stat-on-track">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">On track</CardTitle>
              <Sprout className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {isLoadingFields ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                  {active.length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card data-testid="stat-harvested">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Harvested</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {isLoadingFields ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                  {completed.length}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Today's focus</CardTitle>
                <CardDescription>
                  Fields that need an update from you, sorted by oldest activity first.
                </CardDescription>
              </div>
              <Link href="/fields">
                <Button variant="outline" size="sm" className="gap-1">
                  All my fields <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingFields ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : focusList.length > 0 ? (
              <ul className="divide-y divide-border" data-testid="list-focus">
                {focusList.map((f: Field) => (
                  <li
                    key={f.id}
                    className="py-4 first:pt-0 last:pb-0"
                    data-testid={`focus-field-${f.id}`}
                  >
                    <Link href={`/fields/${f.id}`}>
                      <div className="flex items-start justify-between gap-4 group cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {f.name}
                            </h3>
                            <StageBadge stage={f.stage} />
                            {f.status === "at_risk" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 text-xs"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> At risk
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Sprout className="h-3.5 w-3.5" /> {f.cropType}
                            </span>
                            {f.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {f.location}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" /> Planted{" "}
                              {new Date(f.plantingDate).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            Last update
                          </p>
                          <p className="text-sm font-medium">
                            {f.lastUpdateAt
                              ? new Date(f.lastUpdateAt).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <Sprout className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-foreground">No fields assigned</p>
                <p className="text-sm mt-1">
                  Your coordinator hasn't assigned any fields to you yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My recent updates</CardTitle>
            <CardDescription>
              The latest activity on the fields you're responsible for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent && recent.length > 0 ? (
              <ul
                className="space-y-4"
                data-testid="list-my-recent-updates"
              >
                {recent.map((u) => (
                  <li
                    key={u.id}
                    className="flex gap-3"
                    data-testid={`my-update-${u.id}`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sprout className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/fields/${u.fieldId}`}
                          className="font-semibold text-sm hover:text-primary transition-colors truncate"
                        >
                          {u.fieldName}
                        </Link>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {u.newStage && (
                        <Badge
                          variant="outline"
                          className="bg-primary/5 text-primary text-xs font-normal mt-1"
                        >
                          Stage → {u.newStage}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        "{u.note}"
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No updates logged yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
