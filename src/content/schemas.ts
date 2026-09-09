import { z } from "zod";

export const sourceReferenceSchema = z.object({
  file: z.enum(["File 1", "File 2", "File 3"]),
  page: z.number().int().positive(),
  unit: z.string().optional(),
  lesson: z.string().optional(),
  sourceEntry: z.string().min(1),
  sourceMeaningZh: z.string().min(1),
  sourcePos: z.string().min(1),
});

export const vocabularyEntrySchema = z.object({
  id: z.string().regex(/^C\d{4}$/),
  word: z.string().min(1),
  lemma: z.string().min(1),
  meaningZh: z.string().min(1),
  pos: z.string().min(1),
  world: z.string().min(1),
  category: z.string().min(1),
  difficulty: z.number().int().min(1).max(5),
  imageability: z.number().int().min(1).max(5),
  actionability: z.enum(["Low", "Medium", "High"]),
  imagePath: z.string().startsWith("/images/").optional(),
  audioPath: z.string().startsWith("/audio/").optional(),
  source: z.array(sourceReferenceSchema).min(1),
  relatedWordIds: z.array(z.string().regex(/^C\d{4}$/)),
  contrastWordIds: z.array(z.string().regex(/^C\d{4}$/)),
  media: z.object({
    image: z.string().optional(),
    audioWord: z.string().optional(),
    audioSlow: z.string().optional(),
  }),
  mvp: z.object({
    enabled: z.boolean(),
    rank: z.number().int().min(1).max(30).optional(),
  }),
  contentVersion: z.number().int().positive(),
});

export const vocabularyContentSchema = z.object({
  contentVersion: z.number().int().positive(),
  source: z.object({
    file: z.string().min(1),
    rawEntryCount: z.number().int().nonnegative(),
    cleanEntryCount: z.number().int().nonnegative(),
  }),
  entries: z.array(vocabularyEntrySchema),
});

export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type VocabularyEntry = z.infer<typeof vocabularyEntrySchema>;
export type VocabularyContent = z.infer<typeof vocabularyContentSchema>;
