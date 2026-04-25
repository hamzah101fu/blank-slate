import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Bucket = "guftugu-audio" | "guftugu-images";

export function useStorageUpload() {
  const [uploading, setUploading] = useState(false);

  async function uploadFile(bucket: Bucket, file: File): Promise<string> {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return { uploadFile, uploading };
}
