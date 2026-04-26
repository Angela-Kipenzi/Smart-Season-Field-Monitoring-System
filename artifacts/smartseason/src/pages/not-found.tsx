import { Show } from "@clerk/react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <CardTitle>Page not found</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                The page you're looking for doesn't exist or was moved.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Show when="signed-in">
            <Button asChild className="w-full gap-2">
              <Link href="/dashboard">
                Go to dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Show>
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/">
              Go to home <Home className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
