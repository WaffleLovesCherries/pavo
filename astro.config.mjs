import { defineConfig } from 'astro/config';
import rehypeMethodIcons from './src/lib/rehypeMethodIcons.ts';

const base = '/';

export default defineConfig({
  site: 'https://chocolates-para-andrea.ricardowatts.dev',
  base,
  output: 'static',
  trailingSlash: 'always',
  markdown: {
    // Decorates method steps with icons for the words they contain (see src/config/iconKeywords.ts).
    rehypePlugins: [[rehypeMethodIcons, { base, limit: 3 }]],
  },
});
