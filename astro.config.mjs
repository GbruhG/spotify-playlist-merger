import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  build: {
    outDir: 'dist' // This should be the default, but ensure it's set correctly
  },
  output: 'server',
  integrations: [tailwind()],
  adapter: vercel()
});