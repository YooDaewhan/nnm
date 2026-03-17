import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: './openapi.yaml',
      validation: false,
    },
    output: {
      target: 'src/api/generated.ts',
      client: 'fetch',
      override: {
        mutator: {
          path: 'src/api/client.ts',
          name: 'customFetch',
        },
      },
    },
  },
});
