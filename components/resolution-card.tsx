"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, Edit, Trash2, Plus, Target, NotebookPen } from "lucide-react"

interface Target {
  id: string
  title: string
  is_completed: boolean
  created_at: string
}

interface TargetNote {
  id: string
  target_id: string
  title: string
  content: string | null
  created_at: string
}

interface NoteDraft {
  title: string
  content: string
}

interface Resolution {
  id: string
  title: string
  description: string | null
  is_completed: boolean
  created_at: string
}

interface ResolutionCardProps {
  resolution: Resolution
  onResolutionUpdated: () => void
}

export default function ResolutionCard({ resolution, onResolutionUpdated }: ResolutionCardProps) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [targets, setTargets] = useState<Target[]>([])
  const [targetNotes, setTargetNotes] = useState<Record<string, TargetNote[]>>({})
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({})
  const [newNoteByTarget, setNewNoteByTarget] = useState<Record<string, NoteDraft>>({})
  const [noteLoadingByTarget, setNoteLoadingByTarget] = useState<Record<string, boolean>>({})
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTargetDialog, setShowTargetDialog] = useState(false)
  const [showEditTargetDialog, setShowEditTargetDialog] = useState(false)
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false)
  const [showDeleteResolutionAlert, setShowDeleteResolutionAlert] = useState(false)
  const [showDeleteTargetAlert, setShowDeleteTargetAlert] = useState(false)
  const [showDeleteNoteAlert, setShowDeleteNoteAlert] = useState(false)
  const [editForm, setEditForm] = useState({ title: resolution.title, description: resolution.description || "" })
  const [newTargetTitle, setNewTargetTitle] = useState("")
  const [editTargetForm, setEditTargetForm] = useState({ id: "", title: "" })
  const [editNoteForm, setEditNoteForm] = useState({ id: "", target_id: "", title: "", content: "" })
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (expanded) {
      fetchTargets()
    }
  }, [expanded])

  const fetchTargetNotes = async (targetIds: string[]) => {
    if (targetIds.length === 0) {
      setTargetNotes({})
      return
    }

    try {
      const { data, error } = await supabase
        .from("target_notes")
        .select("*")
        .in("target_id", targetIds)
        .order("created_at", { ascending: true })

      if (error) throw error

      const grouped = (data || []).reduce<Record<string, TargetNote[]>>((acc, note) => {
        if (!acc[note.target_id]) {
          acc[note.target_id] = []
        }

        acc[note.target_id].push(note)
        return acc
      }, {})

      setTargetNotes(grouped)
    } catch (err) {
      console.error("Error fetching target notes:", err)
    }
  }

  const fetchTargets = async () => {
    try {
      const { data, error } = await supabase
        .from("targets")
        .select("*")
        .eq("resolution_id", resolution.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      const nextTargets = data || []
      const targetIds = nextTargets.map((target) => target.id)

      setTargets(nextTargets)
      setExpandedTargets((prev) => {
        const next: Record<string, boolean> = {}

        for (const target of nextTargets) {
          next[target.id] = prev[target.id] ?? true
        }

        return next
      })
      setNewNoteByTarget((prev) => {
        const next: Record<string, NoteDraft> = {}

        for (const target of nextTargets) {
          next[target.id] = prev[target.id] || { title: "", content: "" }
        }

        return next
      })

      await fetchTargetNotes(targetIds)
    } catch (err) {
      console.error("Error fetching targets:", err)
    }
  }

  const refreshNotesForCurrentTargets = async () => {
    await fetchTargetNotes(targets.map((target) => target.id))
  }

  const handleToggleComplete = async () => {
    try {
      const { error } = await supabase
        .from("resolutions")
        .update({ is_completed: !resolution.is_completed })
        .eq("id", resolution.id)

      if (error) throw error
      onResolutionUpdated()
    } catch (err) {
      console.error("Error updating resolution:", err)
    }
  }

  const handleUpdateResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!editForm.title.trim()) {
      setError("Title is required")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("resolutions")
        .update({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
        })
        .eq("id", resolution.id)

      if (error) throw error

      setShowEditDialog(false)
      onResolutionUpdated()
    } catch (err: any) {
      setError(err.message || "Failed to update resolution")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResolution = async () => {
    try {
      const { error } = await supabase.from("resolutions").delete().eq("id", resolution.id)

      if (error) throw error
      setShowDeleteResolutionAlert(false)
      onResolutionUpdated()
    } catch (err) {
      console.error("Error deleting resolution:", err)
    }
  }

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newTargetTitle.trim()) {
      setError("Target title is required")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("targets").insert([
        {
          resolution_id: resolution.id,
          title: newTargetTitle.trim(),
        },
      ])

      if (error) throw error

      setNewTargetTitle("")
      setShowTargetDialog(false)
      await fetchTargets()
    } catch (err: any) {
      setError(err.message || "Failed to create target")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTarget = async (targetId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase.from("targets").update({ is_completed: !isCompleted }).eq("id", targetId)

      if (error) throw error
      await fetchTargets()
    } catch (err) {
      console.error("Error updating target:", err)
    }
  }

  const handleCreateNote = async (e: React.FormEvent, targetId: string) => {
    e.preventDefault()
    setError(null)

    const draft = newNoteByTarget[targetId] || { title: "", content: "" }
    const title = draft.title.trim()
    const content = draft.content.trim()

    if (!title) {
      setError("Nama grup catatan wajib diisi")
      return
    }

    setNoteLoadingByTarget((prev) => ({ ...prev, [targetId]: true }))

    try {
      const { error } = await supabase.from("target_notes").insert([
        {
          target_id: targetId,
          title,
          content,
        },
      ])

      if (error) throw error

      setNewNoteByTarget((prev) => ({ ...prev, [targetId]: { title: "", content: "" } }))
      await refreshNotesForCurrentTargets()
    } catch (err: any) {
      setError(err.message || "Failed to create note group")
    } finally {
      setNoteLoadingByTarget((prev) => ({ ...prev, [targetId]: false }))
    }
  }

  const handleOpenEditNote = (note: TargetNote) => {
    setError(null)
    setEditNoteForm({
      id: note.id,
      target_id: note.target_id,
      title: note.title,
      content: note.content || "",
    })
    setShowEditNoteDialog(true)
  }

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const title = editNoteForm.title.trim()
    if (!title) {
      setError("Nama grup catatan wajib diisi")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("target_notes")
        .update({
          title,
          content: editNoteForm.content.trim() || null,
        })
        .eq("id", editNoteForm.id)

      if (error) throw error

      setShowEditNoteDialog(false)
      await refreshNotesForCurrentTargets()
    } catch (err: any) {
      setError(err.message || "Failed to update note group")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!noteToDelete) return

    try {
      const { error } = await supabase
        .from("target_notes")
        .delete()
        .eq("id", noteToDelete)

      if (error) throw error
      setShowDeleteNoteAlert(false)
      setNoteToDelete(null)
      await refreshNotesForCurrentTargets()
    } catch (err) {
      console.error("Error deleting note group:", err)
    }
  }

  const handleEditTarget = (target: Target) => {
    setEditTargetForm({ id: target.id, title: target.title })
    setShowEditTargetDialog(true)
  }

  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!editTargetForm.title.trim()) {
      setError("Target title is required")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from("targets")
        .update({ title: editTargetForm.title.trim() })
        .eq("id", editTargetForm.id)

      if (error) throw error

      setShowEditTargetDialog(false)
      await fetchTargets()
    } catch (err: any) {
      setError(err.message || "Failed to update target")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTarget = async () => {
    if (!targetToDelete) return

    try {
      const { error } = await supabase.from("targets").delete().eq("id", targetToDelete)

      if (error) throw error
      setShowDeleteTargetAlert(false)
      setTargetToDelete(null)
      await fetchTargets()
    } catch (err) {
      console.error("Error deleting target:", err)
    }
  }

  const completedTargets = targets.filter((t) => t.is_completed).length
  const progressPercentage = targets.length > 0 ? Math.round((completedTargets / targets.length) * 100) : 0

  return (
    <>
      <Card className="border-border/50 hover:border-primary/30 transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={resolution.is_completed}
                onCheckedChange={handleToggleComplete}
                className="mt-1"
              />
              <div className="flex-1">
                <CardTitle
                  className={`text-xl ${resolution.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                >
                  {resolution.title}
                </CardTitle>
                {resolution.description && (
                  <p className="text-sm text-muted-foreground mt-2">{resolution.description}</p>
                )}
                {targets.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {completedTargets} / {targets.length} targets completed
                      </span>
                      <span className="text-primary font-semibold">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteResolutionAlert(true)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0">
            <div className="border-t border-border/50 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Milestones / Targets
                </h4>
                <Button size="sm" onClick={() => setShowTargetDialog(true)} className="gap-2 h-8">
                  <Plus className="w-3 h-3" />
                  Add Target
                </Button>
              </div>

              {targets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No targets yet. Break down your resolution into smaller milestones!
                </p>
              ) : (
                <div className="space-y-2">
                  {targets.map((target) => (
                    <div
                      key={target.id}
                      className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={target.is_completed}
                            onCheckedChange={() => handleToggleTarget(target.id, target.is_completed)}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm ${target.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                            >
                              {target.title}
                            </p>
                            {(targetNotes[target.id] || []).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {(targetNotes[target.id] || []).length} grup catatan
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setExpandedTargets((prev) => ({
                                ...prev,
                                [target.id]: !prev[target.id],
                              }))
                            }
                            aria-label={expandedTargets[target.id] ? "Collapse notes" : "Expand notes"}
                          >
                            {expandedTargets[target.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditTarget(target)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setTargetToDelete(target.id)
                              setShowDeleteTargetAlert(true)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {expandedTargets[target.id] && (
                        <div className="mt-3 ml-8 border-l border-border/70 pl-4 space-y-3">
                          {(targetNotes[target.id] || []).length === 0 ? (
                            <p className="text-xs text-muted-foreground">Belum ada catatan. Tambahkan grup seperti "Olahraga" atau "Makan".</p>
                          ) : (
                            <div className="space-y-2">
                              {(targetNotes[target.id] || []).map((note) => (
                                <div key={note.id} className="rounded-md border border-border/70 bg-background/70 p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <NotebookPen className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                      <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditNote(note)}>
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive"
                                        onClick={() => {
                                          setNoteToDelete(note.id)
                                          setShowDeleteNoteAlert(true)
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="mt-2 whitespace-pre-line wrap-break-word text-sm text-muted-foreground">
                                    {note.content || "(Belum ada isi catatan)"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={(e) => handleCreateNote(e, target.id)} className="space-y-2 rounded-md border border-dashed border-border/70 p-3 bg-background/50">
                            <Input
                              value={(newNoteByTarget[target.id] || { title: "", content: "" }).title}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewNoteByTarget((prev) => ({
                                  ...prev,
                                  [target.id]: {
                                    ...(prev[target.id] || { title: "", content: "" }),
                                    title: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Nama grup (contoh: Olahraga)"
                              className="h-9 bg-background"
                              disabled={noteLoadingByTarget[target.id]}
                            />
                            <Textarea
                              value={(newNoteByTarget[target.id] || { title: "", content: "" }).content}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setNewNoteByTarget((prev) => ({
                                  ...prev,
                                  [target.id]: {
                                    ...(prev[target.id] || { title: "", content: "" }),
                                    content: e.target.value,
                                  },
                                }))
                              }
                              placeholder={"Isi catatan bebas...\ncontoh:\na. Lari 30 menit\nb. Core workout"}
                              className="bg-background min-h-20"
                              disabled={noteLoadingByTarget[target.id]}
                            />
                            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                              <Button
                                type="submit"
                                size="sm"
                                className="h-8"
                                disabled={noteLoadingByTarget[target.id] || !((newNoteByTarget[target.id] || { title: "", content: "" }).title || "").trim()}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Tambah Grup Catatan
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edit Resolution Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resolution</DialogTitle>
            <DialogDescription>Update your resolution details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateResolution}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Title *</label>
                <Input
                  value={editForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  placeholder="Resolution title"
                  disabled={loading}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Add more details..."
                  disabled={loading}
                  className="bg-background min-h-2.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !editForm.title.trim()} className="bg-primary">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Group Dialog */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Grup Catatan</DialogTitle>
            <DialogDescription>Perbarui nama grup dan isi catatan</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateNote}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Nama Grup *</label>
                <Input
                  value={editNoteForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditNoteForm({ ...editNoteForm, title: e.target.value })
                  }
                  placeholder="Contoh: Olahraga"
                  disabled={loading}
                  className="bg-background"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Isi Catatan</label>
                <Textarea
                  value={editNoteForm.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditNoteForm({ ...editNoteForm, content: e.target.value })
                  }
                  placeholder={"Isi catatan bebas...\ncontoh:\na. Lari 30 menit\nb. Core workout"}
                  disabled={loading}
                  className="bg-background min-h-24"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditNoteDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !editNoteForm.title.trim()} className="bg-primary">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Target Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Target</DialogTitle>
            <DialogDescription>Create a milestone for "{resolution.title}"</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTarget}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Target Title *</label>
                <Input
                  value={newTargetTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTargetTitle(e.target.value)}
                  placeholder="e.g., Complete 10 workouts"
                  disabled={loading}
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTargetDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newTargetTitle.trim()} className="bg-primary">
                {loading ? "Creating..." : "Add Target"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Target Dialog */}
      <Dialog open={showEditTargetDialog} onOpenChange={setShowEditTargetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Target</DialogTitle>
            <DialogDescription>Update target for "{resolution.title}"</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTarget}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Target Title *</label>
                <Input
                  value={editTargetForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditTargetForm({ ...editTargetForm, title: e.target.value })
                  }
                  placeholder="e.g., Complete 10 workouts"
                  disabled={loading}
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditTargetDialog(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !editTargetForm.title.trim()} className="bg-primary">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Resolution Alert Dialog */}
      <AlertDialog open={showDeleteResolutionAlert} onOpenChange={setShowDeleteResolutionAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resolution "{resolution.title}" and all its targets and notes. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResolution} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Target Alert Dialog */}
      <AlertDialog open={showDeleteTargetAlert} onOpenChange={setShowDeleteTargetAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Target?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this target and all note groups inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTargetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTarget} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Note Group Alert Dialog */}
      <AlertDialog open={showDeleteNoteAlert} onOpenChange={setShowDeleteNoteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this note group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
