import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  trigger: React.ReactNode;
  itemLabel: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({ trigger, itemLabel, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success(`"${itemLabel}" deleted.`);
    } catch {
      toast.error("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5" }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
            Delete "{itemLabel}"?
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "#1E2D3D", opacity: 0.6 }}>
            This will permanently delete this item and all its contents. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            style={{ borderColor: "#E8E0D5", color: "#1E2D3D", backgroundColor: "white" }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            style={{ backgroundColor: "#C17B4A", color: "white", border: "none" }}
          >
            {loading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
