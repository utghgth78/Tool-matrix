import { z } from "zod";

export const scanDriveSchema = z.object({
  folderUrl: z.string().min(10).max(2000)
});

export const metadataSchema = z.object({
  fileName: z.string().min(1).max(300),
  folderName: z.string().max(300).optional()
});

export const scheduleUploadSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  delayMinutes: z.number().int().min(0).max(1440).optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending", "metadata_ready", "scheduled", "failed"])
});
