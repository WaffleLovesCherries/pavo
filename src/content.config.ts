import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_KEYS } from './config/categories';

const level = z.number().int().min(0).max(5);
const amount = z.union([z.string(), z.number()]).transform(String);
/** [name, amount] or [name, amount, icon]; zod 3 tuples cannot have optional items, hence the union. */
const ingredient = z.union([z.tuple([z.string(), amount]), z.tuple([z.string(), amount, z.string()])]);

const recipes = defineCollection({
  // The template lives one folder up (src/content/recipe-template.md) so it never becomes a recipe:
  // the dev watcher ignores negated patterns, so an underscore-prefixed file in here would still be loaded on save.
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
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
    ingredients: z.array(ingredient).default([]),
  }),
});

export const collections = { recipes };
