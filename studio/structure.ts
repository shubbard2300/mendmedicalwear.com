import type {StructureResolver} from 'sanity/structure'
import {singletonTypes} from './schemaTypes'

const singletons = [
  {id: 'homePage', title: 'Home page'},
  {id: 'siteSettings', title: 'Site settings'},
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      ...singletons.map(({id, title}) => S.listItem().title(title).id(id).child(S.document().schemaType(id).documentId(id))),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !singletonTypes.has(String(item.getId()))),
    ])
