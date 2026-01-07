"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import YearCard from "@/components/year-card"
import { Plus, LogOut, CalendarDays } from "lucide-react"

interface Year {
  id: string
  year_number: number
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [years, setYears] = useState<Year[]>([])
  const [loading, setLoading] = useState(true)
  const [newYear, setNewYear] = useState("")
  const [creatingYear, setCreatingYear] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showLogoutAlert, setShowLogoutAlert] = useState(false)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        setUser(session.user)
        fetchYears()
      } catch (err) {
        console.error("Error initializing dashboard:", err)
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [router, supabase])

  const fetchYears = async () => {
    try {
      const { data, error } = await supabase.from("years").select("*").order("year_number", { ascending: false })

      if (error) throw error
      setYears(data || [])
    } catch (err) {
      console.error("Error fetching years:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const year = Number.parseInt(newYear)

    if (isNaN(year) || year < 2000 || year > 2100) {
      setError("Please enter a valid year between 2000 and 2100")
      return
    }

    if (years.some((y) => y.year_number === year)) {
      setError("This year already exists")
      return
    }

    setCreatingYear(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to create a year")
        return
      }

      const { error } = await supabase.from("years").insert([
        {
          year_number: year,
          user_id: user.id,
        },
      ])

      if (error) throw error

      setNewYear("")
      await fetchYears()
    } catch (err: any) {
      setError(err.message || "Failed to create year")
    } finally {
      setCreatingYear(false)
    }
  }

  const handleLogout = async () => {
    setShowLogoutAlert(false)
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading your resolutions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Resolution Tracker</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setShowLogoutAlert(true)} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Create Year Section */}
        <Card className="border-border/50 mb-12">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateYear} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-3">Add a New Year</label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={newYear}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewYear(e.target.value)}
                    placeholder="2025"
                    min="2000"
                    max="2100"
                    disabled={creatingYear}
                    className="flex-1 bg-background border-input"
                  />
                  <Button
                    type="submit"
                    disabled={creatingYear || !newYear}
                    className="bg-primary hover:bg-primary/90 gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Year
                  </Button>
                </div>
                {error && <p className="text-sm text-destructive mt-2">{error}</p>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Years Grid */}
        {years.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No years yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {years.map((year) => (
              <YearCard key={year.id} year={year} onYearDeleted={fetchYears} />
            ))}
          </div>
        )}
      </div>

      {/* Logout Alert Dialog */}
      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to sign in again to access your resolutions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
