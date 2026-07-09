import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-6 text-sm text-foreground">
        You must be signed in to delete your account.
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm !== "DELETE") {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      toast.success("Your account has been deleted.");
      await signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Could not delete account. Please contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 pb-24 space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl font-bold font-display">Delete Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This will permanently remove your account and personal data.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm space-y-2">
          <p className="font-semibold text-destructive">This cannot be undone.</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Your login, profile, avatar, and reflections will be deleted.</li>
            <li>Messages you sent to your team may remain visible to that team.</li>
            <li>You will be signed out immediately.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          autoCapitalize="characters"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleDelete}
          disabled={loading || confirm !== "DELETE"}
          variant="destructive"
          className="w-full gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Permanently delete my account
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default DeleteAccount;
