import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdminLanguage,
  AdminCourse,
  AdminUnit,
  AdminStage,
  AdminQuestion,
  QuestionType,
} from "./adminTypes";
import { STAGE_DEFS } from "./adminTypes";

// ── Query hooks ────────────────────────────────────────────

export function useLanguages() {
  return useQuery<AdminLanguage[]>({
    queryKey: ["admin", "languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as AdminLanguage[];
    },
  });
}

export function useCourses(languageId: string | null) {
  return useQuery<AdminCourse[]>({
    queryKey: ["admin", "courses", languageId],
    enabled: !!languageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("language_id", languageId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminCourse[];
    },
  });
}

export function useUnits(courseId: string | null) {
  return useQuery<AdminUnit[]>({
    queryKey: ["admin", "units", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("course_id", courseId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminUnit[];
    },
  });
}

export function useStages(unitId: string | null) {
  return useQuery<AdminStage[]>({
    queryKey: ["admin", "stages", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("unit_id", unitId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminStage[];
    },
  });
}

export function useQuestions(stageId: string | null) {
  return useQuery<AdminQuestion[]>({
    queryKey: ["admin", "questions", stageId],
    enabled: !!stageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("stage_id", stageId!)
        .order("order_index");
      if (error) throw error;
      return data as AdminQuestion[];
    },
  });
}

// ── Mutation helpers ───────────────────────────────────────

export async function createLanguage(name: string, code: string) {
  const { error } = await supabase.from("languages").insert({ name, code });
  if (error) throw error;
}

export async function deleteLanguage(id: string) {
  const { error } = await supabase.from("languages").delete().eq("id", id);
  if (error) throw error;
}

export async function createCourse(
  languageId: string,
  title: string,
  description: string
) {
  const { data: existing } = await supabase
    .from("courses")
    .select("order_index")
    .eq("language_id", languageId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
  const { error } = await supabase
    .from("courses")
    .insert({ language_id: languageId, title, description: description || null, order_index: nextIndex });
  if (error) throw error;
}

export async function deleteCourse(id: string) {
  const { data: units } = await supabase.from("units").select("id").eq("course_id", id);
  if (units) {
    for (const unit of units) {
      await deleteUnit(unit.id);
    }
  }
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function createUnit(courseId: string, title: string) {
  const { data: existing } = await supabase
    .from("units")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data: unit, error } = await supabase
    .from("units")
    .insert({ course_id: courseId, title, order_index: nextIndex })
    .select()
    .single();
  if (error) throw error;

  const stages = STAGE_DEFS.map((def) => ({ ...def, unit_id: unit.id }));
  const { error: stageError } = await supabase.from("stages").insert(stages);
  if (stageError) throw stageError;
}

export async function deleteUnit(id: string) {
  const { data: stages } = await supabase.from("stages").select("id").eq("unit_id", id);
  if (stages) {
    for (const stage of stages) {
      const { error } = await supabase.from("questions").delete().eq("stage_id", stage.id);
      if (error) throw error;
    }
  }
  const { error: stageErr } = await supabase.from("stages").delete().eq("unit_id", id);
  if (stageErr) throw stageErr;
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

export async function createQuestion(
  stageId: string,
  type: QuestionType,
  content: Record<string, unknown>,
  orderIndex: number
) {
  const { error } = await supabase
    .from("questions")
    .insert({ stage_id: stageId, type, content, order_index: orderIndex });
  if (error) throw error;
}

export async function updateQuestion(
  id: string,
  content: Record<string, unknown>
) {
  const { error } = await supabase
    .from("questions")
    .update({ content })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderQuestions(
  questions: AdminQuestion[],
  fromIdx: number,
  toIdx: number
) {
  const reordered = [...questions];
  const [moved] = reordered.splice(fromIdx, 1);
  reordered.splice(toIdx, 0, moved);

  const updates = reordered.map((q, i) =>
    supabase.from("questions").update({ order_index: i }).eq("id", q.id)
  );
  await Promise.all(updates);
}

export { useQueryClient };
