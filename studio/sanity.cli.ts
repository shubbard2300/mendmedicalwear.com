import {defineCliConfig} from 'sanity/cli'

// studioHost is set when the hosted Studio is first deployed (decision D1, a hostname Steven picks).
export default defineCliConfig({
  api: {projectId: '7chmng8i', dataset: 'staging'},
  // `npm run typegen` reads the queries in next-app and writes their result types next to them.
  typegen: {
    path: '../next-app/src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../next-app/src/sanity/types.ts',
  },
})
