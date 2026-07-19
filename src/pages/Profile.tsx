import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon, Mail, Shield, LogOut, Loader2, Camera, Pencil, X,
  Phone, Cake, Ruler, Weight, Trophy, Users as UsersIcon, AlertCircle, PlayCircle,
} from "lucide-react";
import OrientationTutorial from "@/components/OrientationTutorial";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProfileRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

interface TeamInfo {
  id: string;
  name: string;
  code: string;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(60, "Max 60 characters"),
  bio: z.string().trim().max(280, "Max 280 characters").nullable(),
  phone: z.string().trim().max(30, "Max 30 characters").nullable(),
  jersey_number: z.number().int().min(0).max(999).nullable(),
  position: z.string().trim().max(40, "Max 40 characters").nullable(),
  height_cm: z.number().int().min(50).max(260).nullable(),
  weight_kg: z.number().int().min(20).max(250).nullable(),
  date_of_birth: z.string().nullable(),
  emergency_contact_name: z.string().trim().max(80).nullable(),
  emergency_contact_phone: z.string().trim().max(30).nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const emptyForm: ProfileForm = {
  display_name: "",
  bio: null,
  phone: null,
  jersey_number: null,
  position: null,
  height_cm: null,
  weight_kg: null,
  date_of_birth: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
};

const Profile = () => {
  const { user, role, teamId, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPlayer = role === "player";

  /* ---------- Load ---------- */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select(
            "user_id, display_name, avatar_url, bio, phone, jersey_number, position, height_cm, weight_kg, date_of_birth, emergency_contact_name, emergency_contact_phone"
          )
          .eq("user_id", user.id)
          .maybeSingle();
        if (profErr) throw profErr;

        let row: ProfileRow;
        if (!prof) {
          // Create stub if missing (handle_new_user trigger should already do this, but be safe)
          const seed = {
            user_id: user.id,
            display_name: user.email?.split("@")[0] ?? "User",
          };
          const { data: created, error: createErr } = await supabase
            .from("profiles")
            .insert(seed)
            .select()
            .single();
          if (createErr) throw createErr;
          row = created as ProfileRow;
        } else {
          row = prof as ProfileRow;
        }

        if (cancelled) return;
        setProfile(row);
        setForm({
          display_name: row.display_name ?? "",
          bio: row.bio,
          phone: row.phone,
          jersey_number: row.jersey_number,
          position: row.position,
          height_cm: row.height_cm,
          weight_kg: row.weight_kg,
          date_of_birth: row.date_of_birth,
          emergency_contact_name: row.emergency_contact_name,
          emergency_contact_phone: row.emergency_contact_phone,
        });

        if (teamId) {
          const { data: t } = await supabase
            .from("teams")
            .select("id, name, code")
            .eq("id", teamId)
            .maybeSingle();
          if (!cancelled) setTeam(t as TeamInfo | null);
        } else {
          setTeam(null);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Could not load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, teamId]);

  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (!user || !profile) return;
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.error(first?.message ?? "Invalid input");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(parsed.data)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data as ProfileRow);
      setEditing(false);
      toast.success("Profile saved");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name ?? "",
      bio: profile.bio,
      phone: profile.phone,
      jersey_number: profile.jersey_number,
      position: profile.position,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      date_of_birth: profile.date_of_birth,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
    });
    setEditing(false);
  };

  /* ---------- Avatar upload ---------- */
  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-pick same file
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data, error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id)
        .select()
        .single();
      if (updErr) throw updErr;

      // Best-effort: clean up previous avatar if it was in our bucket
      if (profile?.avatar_url) {
        const prefix = `/storage/v1/object/public/avatars/`;
        const idx = profile.avatar_url.indexOf(prefix);
        if (idx >= 0) {
          const oldPath = profile.avatar_url.slice(idx + prefix.length);
          if (oldPath && oldPath !== path) {
            supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
          }
        }
      }

      setProfile(data as ProfileRow);
      toast.success("Profile picture updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user || !profile?.avatar_url) return;
    if (!confirm("Remove profile picture?")) return;
    setUploading(true);
    try {
      const prefix = `/storage/v1/object/public/avatars/`;
      const idx = profile.avatar_url.indexOf(prefix);
      if (idx >= 0) {
        const oldPath = profile.avatar_url.slice(idx + prefix.length);
        if (oldPath) {
          await supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
        }
      }
      const { data, error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data as ProfileRow);
      toast.success("Picture removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove");
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || "User";
  const initial = (displayName || user?.email || "U").trim().charAt(0).toUpperCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</p>
          <h1 className="text-2xl font-bold font-display text-foreground">Profile</h1>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
              <X className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + identity card */}
      <div className="bg-card rounded-2xl p-6 shadow-[var(--card-shadow)] flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold font-display shadow-md overflow-hidden">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarPick}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted disabled:opacity-50 transition-colors"
            aria-label="Change profile picture"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFile}
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
          {editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Name</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                maxLength={60}
              />
            </div>
          ) : (
            <p className="text-2xl font-bold font-display text-card-foreground truncate">{displayName}</p>
          )}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Shield className="w-3 h-3" /> {roleLabel}
            </span>
            {team && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                <UsersIcon className="w-3 h-3" /> {team.name}
              </span>
            )}
          </div>
          {profile?.avatar_url && !editing && (
            <button
              type="button"
              onClick={handleAvatarRemove}
              disabled={uploading}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Remove picture
            </button>
          )}
        </div>
      </div>

      {/* About / contact */}
      <Section title="About">
        {editing ? (
          <>
            <Field label="Bio">
              <Textarea
                value={form.bio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value || null }))}
                placeholder="Tell your team a bit about yourself"
                maxLength={280}
                rows={3}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
                placeholder="(555) 123-4567"
                maxLength={30}
              />
            </Field>
          </>
        ) : (
          <>
            <DetailRow icon={<UserIcon className="w-4 h-4 text-primary" />} label="Bio" value={profile?.bio || "—"} multiline />
            <DetailRow icon={<Mail className="w-4 h-4 text-primary" />} label="Email" value={user?.email ?? "—"} />
            <DetailRow icon={<Phone className="w-4 h-4 text-primary" />} label="Phone" value={profile?.phone || "—"} />
          </>
        )}
      </Section>

      {/* Player-specific fields */}
      {isPlayer && (
        <Section title="Player Details">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Jersey #">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.jersey_number ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        jersey_number: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    min={0}
                    max={999}
                  />
                </Field>
                <Field label="Position">
                  <Input
                    value={form.position ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value || null }))}
                    placeholder="e.g. Forward"
                    maxLength={40}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Height (cm)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.height_cm ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        height_cm: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    min={50}
                    max={260}
                  />
                </Field>
                <Field label="Weight (kg)">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={form.weight_kg ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        weight_kg: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    min={20}
                    max={250}
                  />
                </Field>
              </div>
              <Field label="Date of birth">
                <Input
                  type="date"
                  value={form.date_of_birth ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value || null }))}
                />
              </Field>
            </>
          ) : (
            <>
              <DetailRow
                icon={<Trophy className="w-4 h-4 text-primary" />}
                label="Jersey #"
                value={profile?.jersey_number != null ? `#${profile.jersey_number}` : "—"}
              />
              <DetailRow
                icon={<Trophy className="w-4 h-4 text-primary" />}
                label="Position"
                value={profile?.position || "—"}
              />
              <DetailRow
                icon={<Ruler className="w-4 h-4 text-primary" />}
                label="Height"
                value={profile?.height_cm ? `${profile.height_cm} cm` : "—"}
              />
              <DetailRow
                icon={<Weight className="w-4 h-4 text-primary" />}
                label="Weight"
                value={profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}
              />
              <DetailRow
                icon={<Cake className="w-4 h-4 text-primary" />}
                label="Date of birth"
                value={profile?.date_of_birth || "—"}
              />
            </>
          )}
        </Section>
      )}

      {/* Emergency contact */}
      <Section title="Emergency Contact">
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contact name">
              <Input
                value={form.emergency_contact_name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emergency_contact_name: e.target.value || null }))
                }
                maxLength={80}
              />
            </Field>
            <Field label="Contact phone">
              <Input
                value={form.emergency_contact_phone ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, emergency_contact_phone: e.target.value || null }))
                }
                maxLength={30}
              />
            </Field>
          </div>
        ) : (
          <>
            <DetailRow
              icon={<AlertCircle className="w-4 h-4 text-primary" />}
              label="Name"
              value={profile?.emergency_contact_name || "—"}
            />
            <DetailRow
              icon={<Phone className="w-4 h-4 text-primary" />}
              label="Phone"
              value={profile?.emergency_contact_phone || "—"}
            />
          </>
        )}
      </Section>

      {/* Team info */}
      {team && (
        <Section title="Team">
          <DetailRow icon={<UsersIcon className="w-4 h-4 text-primary" />} label="Team name" value={team.name} />
          <div data-tour="profile-team-code">
            <DetailRow icon={<Shield className="w-4 h-4 text-primary" />} label="Team code" value={team.code} />
          </div>
        </Section>
      )}

      {!editing && (
        <div className="space-y-2">
          <Button
            onClick={() => setTutorialOpen(true)}
            variant="outline"
            className="w-full gap-2"
          >
            <PlayCircle className="w-4 h-4" /> Replay orientation tutorial
          </Button>
          <Button onClick={handleSignOut} variant="destructive" className="w-full gap-2">
            <LogOut className="w-4 h-4" /> Log out
          </Button>
          <div className="flex flex-wrap gap-3 justify-center pt-2 text-xs text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground underline">Privacy</a>
            <a href="/terms" className="hover:text-foreground underline">Terms</a>
            <a href="/support" className="hover:text-foreground underline">Support</a>
            <a href="/delete-account" className="hover:text-destructive underline">Delete account</a>
          </div>
        </div>
      )}

      <OrientationTutorial open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl shadow-[var(--card-shadow)] overflow-hidden">
    <div className="px-4 pt-4 pb-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</p>
    </div>
    <div className="px-4 pb-4 space-y-3 [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-border [&>*:not(:last-child)]:pb-3">
      {children}
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const DetailRow = ({
  icon,
  label,
  value,
  multiline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) => (
  <div className="flex items-start gap-3 pt-3 first:pt-0">
    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p
        className={`text-sm font-medium text-card-foreground ${
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        }`}
      >
        {value}
      </p>
    </div>
  </div>
);

export default Profile;
