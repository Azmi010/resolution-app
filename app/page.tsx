"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Sparkles } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)

      if (session) {
        router.push("/dashboard")
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        router.push("/dashboard")
      }
    })

    return () => subscription?.unsubscribe()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-semibold text-primary">Resolution Tracker</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Achieve Your Goals This Year
            </h1>

            <p className="text-lg text-muted-foreground mb-8 text-pretty">
              Track your New Year's resolutions with detailed milestones, visual progress bars, and achieve more than
              ever before.
            </p>

            <div className="flex gap-4 flex-wrap">
              <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={() => router.push("/auth/signup")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
            </div>
          </div>

          {/* Feature Card Preview */}
          <div className="space-y-4">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg mt-1">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Set Clear Goals</h3>
                    <p className="text-sm text-muted-foreground">
                      Define resolutions for each year with detailed descriptions and targets.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent/10 rounded-lg mt-1">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Track Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Mark milestones as complete and watch your progress visualize with live bars.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-4xl font-bold text-primary mb-2">365</p>
            <p className="text-muted-foreground">Days in a Year</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary mb-2">100%</p>
            <p className="text-muted-foreground">Your Success Rate</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-primary mb-2">∞</p>
            <p className="text-muted-foreground">Goals Possible</p>
          </div>
        </div>
      </div>
    </div>
  )
}
