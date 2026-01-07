"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ChevronRight, Trash2 } from "lucide-react"

interface YearCardProps {
  year: {
    id: string
    year_number: number
    created_at: string
  }
  onYearDeleted: () => void
}

export default function YearCard({ year, onYearDeleted }: YearCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.from("years").delete().eq("id", year.id)

      if (error) throw error
      setShowDeleteAlert(false)
      onYearDeleted()
    } catch (err) {
      console.error("Error deleting year:", err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
    <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">{year.year_number}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(year.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              className="w-full gap-2 group-hover:border-primary group-hover:text-primary transition-colors bg-transparent"
              onClick={() => router.push(`/dashboard/year/${year.id}`)}
            >
              View Resolutions
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            onClick={() => setShowDeleteAlert(true)}
            disabled={deleting}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete Year"}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Delete Year Alert Dialog */}
    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Year {year.year_number}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the year {year.year_number} and all its resolutions and targets. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}