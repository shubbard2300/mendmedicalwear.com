import {defineCliConfig} from 'sanity/cli'

// studioHost is set when the hosted Studio is first deployed (decision D1, a hostname Steven picks).
export default defineCliConfig({
  api: {projectId: '7chmng8i', dataset: 'staging'},
})
