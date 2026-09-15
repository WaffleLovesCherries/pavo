import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_KEYS } from './config/categories';

const level = z.number().int().min(0).max(5);

const recipes = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/recipes' }),
  schema: z.object({
    name: z.string(),
    category: z.enum(CATEGORY_KEYS),
    icon: z.string().optional(),
    kind: z.string().optional(),
    prep: z.string(),
    effort: level,
    sweetness: level,
    bitterness: level,
    intensity: level.optional(),
    profile: z.string(),
    pairs: z.number().min(0).max(100),
    tags: z.array(z.string()).default([]),
    lastMade: z.coerce.date().optional(),
    ingredients: z.array(z.tuple([z.string(), z.union([z.string(), z.number()]).transform(String)])).default([]),
  }),
});

export const collections = { recipes };
