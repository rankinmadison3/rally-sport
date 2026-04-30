import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export interface EventFormValue {
  id?: string;
  event_type: string;
  label: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  is_regular_season: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<EventFormValue> | null;
  onSaved: () => void;
  onDeleted?: () => void;
}

const EVENT_TYPES = [
  { value: "game", label: "Game" },
  { value: "practice", label: "Practice" },
  { value: "activity", label: "Activity" },
  { value: "meeting", label: "Meeting" },
  { value: "absence", label: "Absence" },
];

const EventDialog = ({ open, onOpenChange, initial, onSaved, onDeleted }: Props) => {
  const { teamId, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<EventFormValue>({
    event_type: "practice",
    label: "",
    event_date: new Date().toISOString().slice(0, 10),
    event_time: "",
    location: "",
    is_regular_season: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id,
        event_type: initial?.event_type ?? "practice",
        label: initial?.label ?? "",
        event_date: initial?.event_date ?? new Date().toISOString().slice(0, 10),
        event_time: initial?.event_time ?? "",
        location: initial?.location ?? "",
        is_regular_season: initial?.is_regular_season ?? true,
      });
    }
  }, [open, initial]);

  const isEdit = !!form.id;

  const handleSave = async () => {
    if (!teamId || !user) {
      toast.error("No team selected");
      return;
    }
    if (!form.label.trim()) {
      toast.error("Event name is required");
      return;
    }
    setSaving(true);
    const payload = {
      team_id: teamId,
      event_type: form.event_type,
      label: form.label.trim(),
      event_date: form.event_date,
      event_time: form.event_time ? form.event_time : null,
      location: form.location?.trim() ? form.location.trim() : null,
      is_regular_season: form.event_type === "game" ? form.is_regular_season : true,
      created_by: user.id,
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase
        .from("calendar_events")
        .update(payload)
        .eq("id", form.id!));
    } else {
      ({ error } = await supabase.from("calendar_events").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message || "Failed to save event");
      return;
    }
    toast.success(isEdit ? "Event updated" : "Event created");
    onOpenChange(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm("Delete this event?")) return;
    setDeleting(true);
    const { error } = await supabase.from("calendar_events").delete().eq("id", form.id);
    setDeleting(false);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Event deleted");
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="event-type">Type</Label>
            <Select
              value={form.event_type}
              onValueChange={(v) => setForm((f) => ({ ...f, event_type: v }))}
            >
              <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-label">Name</Label>
            <Input
              id="event-label"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. vs Eagles, Team practice"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-time">Time</Label>
              <Input
                id="event-time"
                type="time"
                value={form.event_time ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={form.location ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          {form.event_type === "game" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_regular_season}
                onChange={(e) => setForm((f) => ({ ...f, is_regular_season: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-xs text-muted-foreground">Regular season game</span>
            </label>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div>
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-destructive hover:text-destructive"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;
