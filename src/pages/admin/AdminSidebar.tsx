import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  useLanguages, useCourses, useUnits, useStages,
  createLanguage, deleteLanguage,
  createCourse, deleteCourse,
  createUnit, deleteUnit,
} from "./useAdminData";
import type { StageType } from "./adminTypes";
import { STAGE_LABELS } from "./adminTypes";

// ── Shared form styles ─────────────────────────────────────

const inputStyle = { backgroundColor: "white", borderColor: "#E8E0D5", color: "#1E2D3D" };

const SaveButton = ({ loading, label = "Save" }: { loading: boolean; label?: string }) => (
  <Button
    type="submit"
    disabled={loading}
    style={{ backgroundColor: "#D4A853", color: "#1E2D3D", border: "none", fontWeight: 700 }}
  >
    {loading ? "Saving…" : label}
  </Button>
);

// ── Small icon buttons ─────────────────────────────────────

function IconBtn({ onClick, children, title }: { onClick?: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      title={title}
      className="p-1 rounded opacity-40 hover:opacity-100 transition-opacity"
      style={{ color: "#1E2D3D", background: "none", border: "none", cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

// ── New Language dialog ────────────────────────────────────

const langSchema = z.object({ name: z.string().min(1), code: z.string().min(1).max(20) });
type LangForm = z.infer<typeof langSchema>;

function NewLanguageDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const form = useForm<LangForm>({ resolver: zodResolver(langSchema), defaultValues: { name: "", code: "" } });

  const onSubmit = async (values: LangForm) => {
    setLoading(true);
    try {
      await createLanguage(values.name, values.code);
      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
      toast.success("Language created.");
      setOpen(false);
      form.reset();
    } catch { toast.error("Failed to create language."); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg w-full transition-colors"
          style={{ color: "#6BA3C8", backgroundColor: "transparent", border: "1.5px dashed #6BA3C8" }}
        >
          <Plus size={13} /> New Language
        </button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>
            New Language
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</FormLabel>
                <FormControl><Input placeholder="Urdu" style={inputStyle} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Code</FormLabel>
                <FormControl><Input placeholder="urdu" style={inputStyle} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <SaveButton loading={loading} label="Create Language" />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── New Course dialog ──────────────────────────────────────

const courseSchema = z.object({ title: z.string().min(1), description: z.string() });
type CourseForm = z.infer<typeof courseSchema>;

function NewCourseDialog({ languageId }: { languageId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const form = useForm<CourseForm>({ resolver: zodResolver(courseSchema), defaultValues: { title: "", description: "" } });

  const onSubmit = async (values: CourseForm) => {
    setLoading(true);
    try {
      await createCourse(languageId, values.title, values.description);
      qc.invalidateQueries({ queryKey: ["admin", "courses", languageId] });
      toast.success("Course created.");
      setOpen(false);
      form.reset();
    } catch { toast.error("Failed to create course."); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span><IconBtn title="New course"><Plus size={14} /></IconBtn></span>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>New Course</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</FormLabel>
                <FormControl><Input placeholder="Urdu for Beginners" style={inputStyle} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</FormLabel>
                <FormControl><Input placeholder="Optional" style={inputStyle} {...field} /></FormControl>
              </FormItem>
            )} />
            <SaveButton loading={loading} label="Create Course" />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── New Unit dialog ────────────────────────────────────────

const unitSchema = z.object({ title: z.string().min(1) });
type UnitForm = z.infer<typeof unitSchema>;

function NewUnitDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const form = useForm<UnitForm>({ resolver: zodResolver(unitSchema), defaultValues: { title: "" } });

  const onSubmit = async (values: UnitForm) => {
    setLoading(true);
    try {
      await createUnit(courseId, values.title);
      qc.invalidateQueries({ queryKey: ["admin", "units", courseId] });
      toast.success("Unit created with 6 stages.");
      setOpen(false);
      form.reset();
    } catch { toast.error("Failed to create unit."); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span><IconBtn title="New unit"><Plus size={14} /></IconBtn></span>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: "#FAF6F0", border: "1.5px solid #E8E0D5" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1E2D3D", fontFamily: "'Playfair Display', Georgia, serif" }}>New Unit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title</FormLabel>
                <FormControl><Input placeholder="Haroof e Tahaji" style={inputStyle} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <p className="text-xs" style={{ color: "#1E2D3D", opacity: 0.45 }}>
              6 stages (Aghaaz → Guftugu) will be created automatically.
            </p>
            <SaveButton loading={loading} label="Create Unit" />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ── Tree node shared styles ────────────────────────────────

function TreeRow({
  depth,
  label,
  expanded,
  onToggle,
  actions,
  selected,
  onClick,
}: {
  depth: number;
  label: string;
  expanded?: boolean;
  onToggle?: () => void;
  actions?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-1 group rounded-lg pr-1 transition-colors"
      style={{
        paddingLeft: depth * 12 + 4,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: selected ? "#1E2D3D" : "transparent",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {onToggle && (
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: selected ? "#FAF6F0" : "#1E2D3D", opacity: 0.5 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      )}
      <span className="flex-1 text-sm truncate" style={{ color: selected ? "#FAF6F0" : "#1E2D3D", fontWeight: selected ? 600 : 400 }}>
        {label}
      </span>
      <span className="opacity-0 group-hover:opacity-100 flex items-center" style={{ color: selected ? "#FAF6F0" : "#1E2D3D" }}>
        {actions}
      </span>
    </div>
  );
}

// ── Main sidebar ───────────────────────────────────────────

interface Props {
  selectedStageId: string | null;
  onSelectStage: (stageId: string, stageType: StageType) => void;
}

function StageRows({ unitId, selectedStageId, onSelectStage }: {
  unitId: string;
  selectedStageId: string | null;
  onSelectStage: (id: string, type: StageType) => void;
}) {
  const { data: stages = [] } = useStages(unitId);
  return (
    <>
      {stages.map((stage) => (
        <TreeRow
          key={stage.id}
          depth={3}
          label={STAGE_LABELS[stage.stage_type as StageType]}
          selected={selectedStageId === stage.id}
          onClick={() => onSelectStage(stage.id, stage.stage_type as StageType)}
        />
      ))}
    </>
  );
}

function UnitRows({ courseId, selectedStageId, onSelectStage }: {
  courseId: string;
  selectedStageId: string | null;
  onSelectStage: (id: string, type: StageType) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();
  const { data: units = [] } = useUnits(courseId);

  return (
    <>
      {units.map((unit) => (
        <div key={unit.id}>
          <TreeRow
            depth={2}
            label={unit.title}
            expanded={!!expanded[unit.id]}
            onToggle={() => setExpanded((p) => ({ ...p, [unit.id]: !p[unit.id] }))}
            actions={
              <>
                <DeleteConfirmDialog
                  trigger={<span><IconBtn title="Delete unit"><Trash2 size={12} /></IconBtn></span>}
                  itemLabel={unit.title}
                  onConfirm={async () => {
                    await deleteUnit(unit.id);
                    qc.invalidateQueries({ queryKey: ["admin", "units", courseId] });
                  }}
                />
              </>
            }
          />
          {expanded[unit.id] && (
            <StageRows unitId={unit.id} selectedStageId={selectedStageId} onSelectStage={onSelectStage} />
          )}
        </div>
      ))}
    </>
  );
}

function CourseRows({ languageId, selectedStageId, onSelectStage }: {
  languageId: string;
  selectedStageId: string | null;
  onSelectStage: (id: string, type: StageType) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();
  const { data: courses = [] } = useCourses(languageId);

  return (
    <>
      {courses.map((course) => (
        <div key={course.id}>
          <TreeRow
            depth={1}
            label={course.title}
            expanded={!!expanded[course.id]}
            onToggle={() => setExpanded((p) => ({ ...p, [course.id]: !p[course.id] }))}
            actions={
              <>
                <NewUnitDialog courseId={course.id} />
                <DeleteConfirmDialog
                  trigger={<span><IconBtn title="Delete course"><Trash2 size={12} /></IconBtn></span>}
                  itemLabel={course.title}
                  onConfirm={async () => {
                    await deleteCourse(course.id);
                    qc.invalidateQueries({ queryKey: ["admin", "courses", languageId] });
                  }}
                />
              </>
            }
          />
          {expanded[course.id] && (
            <UnitRows courseId={course.id} selectedStageId={selectedStageId} onSelectStage={onSelectStage} />
          )}
        </div>
      ))}
    </>
  );
}

export function AdminSidebar({ selectedStageId, onSelectStage }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();
  const { data: languages = [] } = useLanguages();

  return (
    <div
      className="flex flex-col h-full"
      style={{ borderRight: "1.5px solid #E8E0D5", backgroundColor: "#FFFFFF", width: 280, flexShrink: 0 }}
    >
      <div className="p-3 pb-2" style={{ borderBottom: "1px solid #E8E0D5" }}>
        <NewLanguageDialog />
      </div>
      <ScrollArea className="flex-1 p-2">
        {languages.map((lang) => (
          <div key={lang.id}>
            <TreeRow
              depth={0}
              label={lang.name}
              expanded={!!expanded[lang.id]}
              onToggle={() => setExpanded((p) => ({ ...p, [lang.id]: !p[lang.id] }))}
              actions={
                <>
                  <NewCourseDialog languageId={lang.id} />
                  <DeleteConfirmDialog
                    trigger={<span><IconBtn title="Delete language"><Trash2 size={12} /></IconBtn></span>}
                    itemLabel={lang.name}
                    onConfirm={async () => {
                      await deleteLanguage(lang.id);
                      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
                    }}
                  />
                </>
              }
            />
            {expanded[lang.id] && (
              <CourseRows languageId={lang.id} selectedStageId={selectedStageId} onSelectStage={onSelectStage} />
            )}
          </div>
        ))}
        {languages.length === 0 && (
          <p className="text-xs p-3" style={{ color: "#1E2D3D", opacity: 0.35 }}>
            No languages yet. Create one above.
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
