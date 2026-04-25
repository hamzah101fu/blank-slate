import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { QuestionFieldsForType, buildContent } from "./QuestionFields";
import { useStorageUpload } from "./useStorageUpload";
import { useQuestions, createQuestion, deleteQuestion, reorderQuestions } from "./useAdminData";
import type { StageType, QuestionType } from "./adminTypes";
import { QUESTION_TYPES_BY_STAGE, QUESTION_TYPE_LABELS } from "./adminTypes";

interface Props {
  stageId: string;
  stageType: StageType;
}

function contentPreview(content: Record<string, unknown>): string {
  const val = content.letter || content.word || content.prompt || content.passage || content.audio_url || content.image_url || "";
  return String(val).slice(0, 60) || "—";
}

export function QuestionEditor({ stageId, stageType }: Props) {
  const qc = useQueryClient();
  const { data: questions = [], isLoading } = useQuestions(stageId);
  const { uploadFile, uploading } = useStorageUpload();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<QuestionType | "">("");
  const [saving, setSaving] = useState(false);

  const form = useForm({ defaultValues: {} });

  const allowedTypes = QUESTION_TYPES_BY_STAGE[stageType];

  // ── Dohrao info note ────────────────────────────────────

  if (stageType === "dohrao") {
    return (
      <div
        className="rounded-2xl p-5"
        style={{ border: "1.5px solid #6BA3C8", backgroundColor: "#F0F6FB" }}
      >
        <p className="font-semibold text-sm" style={{ color: "#1E2D3D" }}>
          Dohrao — Auto-Generated Stage
        </p>
        <p className="text-sm mt-2" style={{ color: "#1E2D3D", opacity: 0.6 }}>
          This stage has no editable questions. It is automatically populated from the user's weakest questions across stages 1–4 (Aghaaz, Suno, Samjho, Pehchano).
        </p>
      </div>
    );
  }

  // ── Reorder handlers ────────────────────────────────────

  const handleReorder = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    try {
      await reorderQuestions(questions, fromIdx, toIdx);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
    } catch {
      toast.error("Failed to reorder questions.");
    }
  };

  // ── Save new question ───────────────────────────────────

  const handleSave = form.handleSubmit(async (values) => {
    if (!selectedType) { toast.error("Select a question type."); return; }
    setSaving(true);
    try {
      const content = buildContent(selectedType as QuestionType, values as Record<string, any>);
      await createQuestion(stageId, selectedType as QuestionType, content, questions.length);
      qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
      toast.success("Question added.");
      setAddOpen(false);
      setSelectedType("");
      form.reset({});
    } catch {
      toast.error("Failed to save question.");
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Questions
        </h2>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setSelectedType(""); form.reset({}); } }}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: "#1E2D3D", color: "#FAF6F0", border: "none", cursor: "pointer" }}
            >
              <Plus size={14} /> Add Question
            </button>
          </DialogTrigger>
          <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5", maxWidth: 520 }}>
            <DialogHeader>
              <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
                Add Question
              </DialogTitle>
            </DialogHeader>

            {/* Type selector */}
            <div className="mb-4">
              <label style={{ color: "#1E2D3D", opacity: 0.55, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Question Type
              </label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as QuestionType)}
              >
                <SelectTrigger className="mt-1" style={{ backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" }}>
                  <SelectValue placeholder="Choose a type…" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: "white", borderColor: "#E8E0D5" }}>
                  {allowedTypes.map((t) => (
                    <SelectItem key={t} value={t} style={{ color: "#1E2D3D" }}>
                      {QUESTION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form fields */}
            {selectedType && (
              <ScrollArea className="max-h-[50vh] pr-2">
                <Form {...form}>
                  <div className="flex flex-col gap-4">
                    <QuestionFieldsForType
                      type={selectedType as QuestionType}
                      form={form}
                      uploadFile={uploadFile}
                      uploading={uploading}
                    />
                  </div>
                </Form>
              </ScrollArea>
            )}

            {/* Save button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                disabled={saving || !selectedType}
                className="px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  backgroundColor: "#D4A853",
                  color: "#1E2D3D",
                  border: "none",
                  cursor: saving || !selectedType ? "not-allowed" : "pointer",
                  opacity: saving || !selectedType ? 0.6 : 1,
                }}
              >
                {saving ? "Saving…" : "Save Question"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Question list */}
      {isLoading ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.4 }}>Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm" style={{ color: "#1E2D3D", opacity: 0.35 }}>
          No questions yet. Click "Add Question" to get started.
        </p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E8E0D5" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "white", borderBottom: "1.5px solid #E8E0D5" }}>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", width: 40 }}>#</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Type</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Preview</TableHead>
                <TableHead style={{ color: "#1E2D3D", opacity: 0.5, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", width: 100 }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q, i) => (
                <TableRow key={q.id} style={{ backgroundColor: i % 2 === 0 ? "white" : "#FDFAF6", borderBottom: "1px solid #F0EAE0" }}>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.4, fontSize: 12 }}>{i + 1}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: "#E8F0F8", color: "#1E2D3D", fontWeight: 500, fontSize: 11 }}>
                      {QUESTION_TYPE_LABELS[q.type] || q.type}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: "#1E2D3D", opacity: 0.7, fontSize: 13, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {contentPreview(q.content)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(i, i - 1)}
                        disabled={i === 0}
                        title="Move up"
                        style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: "#1E2D3D", opacity: i === 0 ? 0.2 : 0.5, padding: 2 }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder(i, i + 1)}
                        disabled={i === questions.length - 1}
                        title="Move down"
                        style={{ background: "none", border: "none", cursor: i === questions.length - 1 ? "default" : "pointer", color: "#1E2D3D", opacity: i === questions.length - 1 ? 0.2 : 0.5, padding: 2 }}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <DeleteConfirmDialog
                        trigger={
                          <button title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#C17B4A", opacity: 0.7, padding: 2 }}>
                            <Trash2 size={14} />
                          </button>
                        }
                        itemLabel={`Question ${i + 1}`}
                        onConfirm={async () => {
                          await deleteQuestion(q.id);
                          qc.invalidateQueries({ queryKey: ["admin", "questions", stageId] });
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
