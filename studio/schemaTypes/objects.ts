import {defineArrayMember, defineField, defineType} from 'sanity'

// Locks that apply to every schema in this folder (SEO audit 2026-09-10 and 2026-09-13, anonymity lock 2026-09-11):
//  - no personal name, no author, no founder, no Person fields anywhere;
//  - no price fields: apparel shows "Launch price TBA" as plain text;
//  - copy migrates verbatim, so field names describe where text goes, not what it should say.

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string', description: 'The <title>. Live titles run about 45 to 65 characters.', validation: (r) => r.max(70).warning()}),
    defineField({name: 'description', type: 'text', rows: 3, description: 'Meta description. Live ones run 137 to 159 characters.', validation: (r) => r.max(160).warning()}),
  ],
})

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [defineField({name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required()})],
})

export const ctaLink = defineType({
  name: 'ctaLink',
  title: 'Button or link',
  type: 'object',
  fields: [
    defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'action',
      type: 'string',
      description: 'Where it goes. "modal:reserve" and "modal:inquiry" open the existing forms; anything else is a path or URL.',
      validation: (r) => r.required(),
    }),
  ],
})

// Product page sections. The seven live product pages differ a lot, so a page is an ordered list of
// typed blocks instead of fixed fields. P2 refines these against the parsed HTML.
export const richSection = defineType({
  name: 'richSection',
  title: 'Text section',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'image', type: 'imageWithAlt'}),
    defineField({name: 'imageSide', type: 'string', options: {list: ['left', 'right']}, initialValue: 'right'}),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Text section', subtitle: 'Text section'})},
})

export const stepsSection = defineType({
  name: 'stepsSection',
  title: 'Steps',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [defineField({name: 'title', type: 'string'}), defineField({name: 'body', type: 'text', rows: 3})],
          preview: {select: {title: 'title', subtitle: 'body'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Steps', subtitle: 'Steps'})},
})

export const swatchSection = defineType({
  name: 'swatchSection',
  title: 'Color swatches',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'swatches',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'swatch',
          fields: [
            defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'caption', type: 'string'}),
            defineField({name: 'image', type: 'imageWithAlt'}),
          ],
          preview: {select: {title: 'name', subtitle: 'caption', media: 'image'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Color swatches', subtitle: 'Color swatches'})},
})

export const comparisonSection = defineType({
  name: 'comparisonSection',
  title: 'Comparison',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({
      name: 'columns',
      type: 'array',
      validation: (r) => r.max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'column',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'highlighted', type: 'boolean', initialValue: false}),
            defineField({name: 'points', type: 'array', of: [defineArrayMember({type: 'string'})]}),
          ],
          preview: {select: {title: 'title'}},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Comparison', subtitle: 'Comparison'})},
})

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({name: 'heading', type: 'string'}),
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'cta', type: 'ctaLink'}),
  ],
  preview: {select: {title: 'heading'}, prepare: ({title}) => ({title: title || 'Call to action', subtitle: 'Call to action'})},
})

export const sectionTypes = ['richSection', 'stepsSection', 'swatchSection', 'comparisonSection', 'ctaSection']
