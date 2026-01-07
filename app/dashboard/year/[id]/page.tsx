"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import ResolutionCard from "@/components/resolution-card"
import { ArrowLeft, Plus, Sparkles } from "lucide-react"

interface Resolution {
  id: string
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

interface Year {
  id: string
  year_number: number
}

export default function YearDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const yearId = params.id as string

  const [year, setYear] = useState<Year | null>(null)
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [newResolution, setNewResolution] = useState({ title: "", description: "" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
        return
      }

      await fetchYearData()
      await fetchResolutions()
    }

    checkSessionAndFetch()
  }, [yearId, router, supabase])

  const fetchYearData = async () => {
    try {
      const { data, error } = await supabase.from("years").select("*").eq("id", yearId).single()

      if (error) throw error
      setYear(data)
    } catch (err) {
      console.error("Error fetching year:", err)
      router.push("/dashboard")
    }
  }

  const fetchResolutions = async () => {
    try {
      const { data, error } = await supabase
        .from("resolutions")
        .select("*")
        .eq("year_id", yearId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setResolutions(data || [])
    } catch (err) {
      console.error("Error fetching resolutions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newResolution.title.trim()) {
      setError("Title is required")
      return
    }

    setCreating(true)

    try {
      const { error } = await supabase.from("resolutions").insert([
        {
          year_id: yearId,
          title: newResolution.title.trim(),
          description: newResolution.description.trim() || null,
        },
      ])

      if (error) throw error

      setNewResolution({ title: "", description: "" })
      setShowDialog(false)
      await fetchResolutions()
    } catch (err: any) {
      setError(err.message || "Failed to create resolution")
    } finally {
      setCreating(false)
    }
  }

  const completedCount = resolutions.filter((r) => r.is_completed).length
  const progressPercentage = resolutions.length > 0 ? Math.round((completedCount / resolutions.length) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading resolutions...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Year Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">{year?.year_number} Resolutions</h1>
              <p className="text-muted-foreground mt-1">
                {completedCount} of {resolutions.length} completed ({progressPercentage}%)
              </p>
            </div>
          </div>

          <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Resolution
          </Button>
        </div>

        {/* Resolutions List */}
        {resolutions.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No resolutions yet. Create one to get started!</p>
              <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Resolution
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {resolutions.map((resolution) => (
              <ResolutionCard key={resolution.id} resolution={resolution} onResolutionUpdated={fetchResolutions} />
            ))}
          </div>
        )}

        {/* Create Resolution Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resolution</DialogTitle>
              <DialogDescription>Create a new resolution for {year?.year_number}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateResolution}>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Title *</label>
                  <Input
                    value={newResolution.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewResolution({ ...newResolution, title: e.target.value })
                    }
                    placeholder="e.g., Exercise 3 times a week"
                    disabled={creating}
                    className="bg-background"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Description (optional)</label>
                  <Textarea
                    value={newResolution.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewResolution({ ...newResolution, description: e.target.value })
                    }
                    placeholder="Add more details about your resolution..."
                    disabled={creating}
                    className="bg-background min-h-2.5"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={creating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || !newResolution.title.trim()} className="bg-primary">
                  {creating ? "Creating..." : "Create Resolution"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
