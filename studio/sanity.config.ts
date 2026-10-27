import {visionTool} from '@sanity/vision'
import {defineConfig, type DocumentActionComponent, type Template} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes, singletonTypes} from './schemaTypes'
import {structure} from './structure'

// Project and dataset names are public identifiers, not secrets.
const projectId = '7chmng8i'

const shared = {
  projectId,
  plugins: [structureTool({structure}), visionTool()],
  schema: {
    types: schemaTypes,
    // Singletons never appear in the "new document" menu.
    templates: (templates: Template[]) => templates.filter(({id}) => !singletonTypes.has(id)),
  },
  document: {
    // A singleton cannot be deleted, duplicated or unpublished.
    actions: (prev: DocumentActionComponent[], {schemaType}: {schemaType: string}) =>
      singletonTypes.has(schemaType)
        ? prev.filter(({action}) => action && !['unpublish', 'delete', 'duplicate'].includes(action))
        : prev,
  },
}

// Two workspaces on one Studio: staging is where the migration lands first, production is the live content.
export default defineConfig([
  {...shared, name: 'staging', title: 'MEND (staging)', dataset: 'staging', basePath: '/staging'},
  {...shared, name: 'production', title: 'MEND (production)', dataset: 'production', basePath: '/production'},
])
