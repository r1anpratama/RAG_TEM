import { z } from "zod";

export const chatInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(4000, "Message cannot exceed 4,000 characters."),
  top_k: z.number().int().min(1).max(10).default(4),
  stream: z.boolean().default(true),
});

export type ChatInputFormValues = z.infer<typeof chatInputSchema>;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = [".pdf", ".txt"];

export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "Please select a file to upload." };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));

  if (!hasValidExt) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed formats: ${ALLOWED_EXTENSIONS.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 10 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB).`,
    };
  }

  return { valid: true };
}
