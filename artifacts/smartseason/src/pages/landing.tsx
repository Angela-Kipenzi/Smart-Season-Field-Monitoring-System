import { SignInButton, Show } from "@clerk/react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, BarChart3, Users, Sprout, ShieldCheck, CheckCircle2 } from "lucide-react";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation */}
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <img src={`${base}/logo.svg`} alt="SmartSeason Logo" className="h-8 w-8" />
          <span className="font-bold text-xl text-primary tracking-tight">SmartSeason</span>
        </div>
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button className="rounded-full px-6" data-testid="btn-get-started">Get Started</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
              Go to Dashboard
            </Link>
          </Show>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
          <div className="relative container mx-auto px-4 py-20 lg:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                <Sprout className="h-4 w-4" />
                <span>Field monitoring for coordinators and agents</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.05]">
                Track crop progress across every field — clearly.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
                SmartSeason keeps teams aligned with stage tracking, recent updates, and an at‑risk view that surfaces fields needing attention.
              </p>

              <ul className="grid gap-3 mb-10 text-sm text-muted-foreground max-w-2xl">
                <li className="flex gap-2 items-start">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Invitation-only onboarding with role-based access (Coordinator / Field Agent).</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Stage lifecycle with an auditable update timeline for every field.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>Dashboards scoped to each role, so everyone sees what matters.</span>
                </li>
              </ul>

              <Show when="signed-out">
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    className="rounded-full text-base h-14 px-8 shadow-sm hover:shadow-md transition-all gap-2"
                    data-testid="btn-hero-cta"
                  >
                    Sign in to continue <ArrowRight className="h-5 w-5" />
                  </Button>
                </SignInButton>
                <p className="mt-4 text-sm text-muted-foreground inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Field agents join by invitation from a coordinator.
                </p>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 gap-2"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              </Show>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/20 border-y border-border/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built for field operations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Fast to scan, easy to use, and focused on day-to-day decisions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <article className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-7 flex-1 flex flex-col">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Real-time Dashboard</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    See stage breakdowns, at-risk fields, and recent updates across your entire operation at a single glance.
                  </p>
                </div>
              </article>

              <article className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-7 flex-1 flex flex-col">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-600">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Stage Tracking</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Log transitions from planted to growing, ready, and harvested. Automatic alerts for fields that need attention.
                  </p>
                </div>
              </article>

              <article className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="p-7 flex-1 flex flex-col">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Team Coordination</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Coordinators invite agents by email and assign fields. Agents see exactly what they're responsible for.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border mt-auto">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img src={`${base}/logo.svg`} alt="SmartSeason Logo" className="h-5 w-5 grayscale opacity-70" />
            <span>© {new Date().getFullYear()} SmartSeason. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
