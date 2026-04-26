import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/main-layout";
import {
  useListUsers,
  getListUsersQueryKey,
  useUpdateUserRole,
  Role,
  useGetMe,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Search,
  Shield,
  ShieldAlert,
  MoreHorizontal,
  UserCog,
  Users,
  Mail,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  invitedById: number | null;
  invitedByName: string | null;
  createdAt: string;
  acceptedAt: string | null;
}

import { customFetch, ApiError } from "@workspace/api-client-react";

const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function invitationError(err: unknown, fallback: string): Error {
  if (err instanceof ApiError) {
    const data = err.data as { error?: string; message?: string } | null;
    return new Error(data?.message || data?.error || fallback);
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
}

async function fetchInvitations(): Promise<Invitation[]> {
  try {
    return await customFetch<Invitation[]>(`${apiBase}/api/invitations`, {
      responseType: "json",
    });
  } catch (err) {
    throw invitationError(err, "Failed to load invitations");
  }
}

async function createInvitation(email: string, role: string): Promise<Invitation> {
  try {
    return await customFetch<Invitation>(`${apiBase}/api/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
      responseType: "json",
    });
  } catch (err) {
    throw invitationError(err, "Failed to send invitation");
  }
}

async function deleteInvitation(id: number): Promise<void> {
  try {
    await customFetch<null>(`${apiBase}/api/invitations/${id}`, {
      method: "DELETE",
      responseType: "json",
    });
  } catch (err) {
    throw invitationError(err, "Failed to revoke invitation");
  }
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-0">
        <Shield className="w-3 h-3 mr-1" /> Coordinator
      </Badge>
    );
  }
  return <Badge variant="secondary" className="font-normal">Field Agent</Badge>;
}

function InvitationStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
    revoked: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize ${map[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"field_agent" | "admin">("field_agent");
  const [isInviting, setIsInviting] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const { toast } = useToast();

  const { data: usersData, isLoading, error } = useListUsers({
    query: { queryKey: getListUsersQueryKey(), retry: false },
  });

  const { data: currentUserData } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const updateUserRoleMutation = useUpdateUserRole();

  const isAdmin = currentUserData?.user.role === "admin";

  const refreshInvitations = useCallback(async () => {
    setIsLoadingInvites(true);
    try {
      const data = await fetchInvitations();
      setInvitations(data);
    } catch (err) {
      toast({
        title: "Couldn't load invitations",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingInvites(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) {
      void refreshInvitations();
    }
  }, [isAdmin, refreshInvitations]);

  if (error || (currentUserData && !isAdmin)) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
          <div className="bg-destructive/10 p-4 rounded-full mb-6">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view the agents directory. This area is restricted to Coordinators.
          </p>
        </div>
      </MainLayout>
    );
  }

  const users = usersData || [];
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()),
  );
  const pendingInvites = invitations.filter((inv) => inv.status === "pending");

  const handleRoleChange = (userId: number, newRole: Role, userName: string) => {
    updateUserRoleMutation.mutate(
      { id: userId, data: { role: newRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast({
            title: "Role updated",
            description: `${userName} is now a ${newRole === "admin" ? "Coordinator" : "Field Agent"}.`,
          });
        },
        onError: () => {
          toast({
            title: "Error updating role",
            description: "Please try again later.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setIsInviting(true);
    try {
      await createInvitation(email, inviteRole);
      toast({
        title: "Invitation created",
        description: `${email} can now sign up and join SmartSeason as a ${inviteRole === "admin" ? "Coordinator" : "Field Agent"}.`,
      });
      setInviteEmail("");
      await refreshInvitations();
    } catch (err) {
      toast({
        title: "Couldn't send invitation",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (id: number, email: string) => {
    try {
      await deleteInvitation(id);
      toast({ title: "Invitation revoked", description: email });
      await refreshInvitations();
    } catch (err) {
      toast({
        title: "Couldn't revoke",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Directory</h1>
          <p className="text-muted-foreground mt-1">
            Invite new field agents and coordinators, and manage existing access.
          </p>
        </div>

        {/* Invite form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Invite a teammate
            </CardTitle>
            <CardDescription>
              The person will be able to sign in with this email address. New accounts cannot join without an invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                required
                placeholder="agent@farm.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                data-testid="input-invite-email"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "field_agent" | "admin")}>
                <SelectTrigger className="sm:w-48" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_agent">Field Agent</SelectItem>
                  <SelectItem value="admin">Coordinator</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isInviting} className="gap-2" data-testid="btn-send-invite">
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send invite
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>
              These email addresses can sign up and will automatically receive the assigned role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingInvites ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingInvites.length > 0 ? (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((inv) => (
                      <TableRow key={inv.id} data-testid={`invite-${inv.id}`}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell><RoleBadge role={inv.role} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(inv.createdAt).toLocaleDateString()}
                          {inv.invitedByName && (
                            <span className="block text-xs">by {inv.invitedByName}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                            onClick={() => handleRevoke(inv.id, inv.email)}
                            data-testid={`btn-revoke-${inv.id}`}
                          >
                            <X className="h-3.5 w-3.5" /> Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                <Mail className="mx-auto h-8 w-8 opacity-50 mb-2" />
                <p className="text-sm">No pending invitations.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personnel directory */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Personnel</CardTitle>
                <CardDescription>All registered users in the system.</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  className="pl-9 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><RoleBadge role={user.role} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {currentUserData?.user.id !== user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {user.role === "field_agent" ? (
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(user.id, "admin", user.name)}
                                    className="cursor-pointer"
                                  >
                                    <Shield className="mr-2 h-4 w-4 text-primary" />
                                    <span>Promote to Coordinator</span>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(user.id, "field_agent", user.name)}
                                    className="cursor-pointer"
                                  >
                                    <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Demote to Field Agent</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p>No personnel found matching "{search}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History of accepted invitations */}
        {invitations.some((i) => i.status !== "pending") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitation history</CardTitle>
              <CardDescription>Already-accepted or revoked invitations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations
                      .filter((i) => i.status !== "pending")
                      .map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.email}</TableCell>
                          <TableCell><RoleBadge role={inv.role} /></TableCell>
                          <TableCell><InvitationStatusBadge status={inv.status} /></TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
