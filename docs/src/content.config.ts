import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { z } from "astro/zod";

const heroLayoutSchema = z
  .enum(["centered", "centered-top", "split-left", "split-right", "banner"])
  .default("centered");

const extendedDocsSchema = z.object({
  hero: z
    .object({
      layout: heroLayoutSchema,
      announcement: z
        .object({
          text: z.string(),
          link: z.string(),
        })
        .optional(),
    })
    .optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({ extend: extendedDocsSchema }),
  }),
};
