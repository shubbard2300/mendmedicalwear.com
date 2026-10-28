import {defineArrayMember, defineField, defineType} from 'sanity'

// Locks that apply to every schema in this folder (SEO audit 2026-09-10 and 2026-09-13, anonymity lock 2026-09-11):
//  - no personal name, no author, no founder, no Person fields anywhere;
//  - no price fields: apparel shows "Launch price TBA" as plain text, and the free MEND App's JSON-LD price comes
//    from product.offerKind, so no dollar amount can be typed into the Studio;
//  - copy migrates verbatim, so field names describe where text goes, not what it should say.
// Shapes below come from the P2a extraction of the 12 live pages (see the migration plan note, "P2b").

// The six lead-form modals main.js defines; the pages open them with data-modal.
export const modalNames = ['demo', 'distributor', 'facilityQuote', 'newsletter', 'reserve', 'waitlist']

// ---- shared field pieces ----
const eyebrow = defineField({name: 'eyebrow', type: 'string'})
const heading = defineField({name: 'heading', type: 'text', rows: 2, description: 'A line break is allowed where the live heading breaks.'})
const anchorId = defineField({
  name: 'anchorId',
  type: 'string',
  description: 'The #id that nav links jump to (features, specs, get-started...). Empty if nothing links to it.',
})
const icon = defineField({
  name: 'icon',
  type: 'string',
  description: 'Icon key from the site icon set (the extractor hash until P3 names them). Empty for no icon.',
})

const titled = (label: string) => ({
  select: {title: 'heading'},
  prepare: ({title}: {title?: string}) => ({title: title || label, subtitle: label}),
})

// ---- basic objects ----
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({name: 'title', type: 'string', description: 'The <title>. Live titles run about 45 to 65 characters.', validation: (r) => r.max(70).warning()}),
    defineField({name: 'description', type: 'text', rows: 3, description: 'Meta description. Live ones run 137 to 159 characters.', validation: (r) => r.max(160).warning()}),
    defineField({
      name: 'jsonLdDescription',
      type: 'text',
      rows: 3,
      description: 'The description inside the page JSON-LD block. On the live site it is a different sentence from the meta description, so it is kept on its own.',
    }),
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
    defineField({name: 'modal', type: 'string', description: 'Opens one of the existing lead forms.', options: {list: modalNames}}),
    defineField({name: 'href', type: 'string', description: 'A path or URL. Leave empty when a form is chosen.'}),
    defineField({name: 'product', type: 'string', description: 'The product text the lead form receives (data-product on the live page).'}),
  ],
  validation: (r) =>
    r.custom((value) => {
      const c = value as {modal?: string; href?: string} | undefined
      return !c || c.modal || c.href ? true : 'Choose a form or enter a link'
    }),
  preview: {select: {title: 'label', subtitle: 'modal'}},
})

export const tableBlock = defineType({
  name: 'tableBlock',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({name: 'caption', type: 'string'}),
    defineField({
      name: 'rows',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableRow',
          fields: [
            defineField({
              name: 'cells',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'tableCell',
                  fields: [defineField({name: 'text', type: 'string'}), defineField({name: 'header', type: 'boolean', initialValue: false})],
                  preview: {select: {title: 'text'}},
                }),
              ],
            }),
          ],
          preview: {select: {cells: 'cells'}, prepare: ({cells}) => ({title: (cells || []).map((c: {text?: string}) => c.text).join(' | ')})},
        }),
      ],
    }),
  ],
  preview: {select: {title: 'caption', rows: 'rows'}, prepare: ({title, rows}) => ({title: title || 'Table', subtitle: `${(rows || []).length} rows`})},
})

export const cardItem = defineType({
  name: 'cardItem',
  title: 'Card',
  type: 'object',
  fields: [icon, defineField({name: 'title', type: 'string'}), defineField({name: 'body', type: 'text', rows: 3})],
  preview: {select: {title: 'title', subtitle: 'body'}},
})

export const miniItem = defineType({
  name: 'miniItem',
  title: 'Short feature',
  type: 'object',
  fields: [icon, defineField({name: 'text', type: 'string'})],
  preview: {select: {title: 'text'}},
})

export const specRow = defineType({
  name: 'specRow',
  title: 'Spec row',
  type: 'object',
  fields: [defineField({name: 'label', type: 'string'}), defineField({name: 'value', type: 'string'})],
  preview: {select: {title: 'label', subtitle: 'value'}},
})

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu link',
  type: 'object',
  fields: [defineField({name: 'label', type: 'string', validation: (r) => r.required()}), defineField({name: 'href', type: 'string', validation: (r) => r.required()})],
  preview: {select: {title: 'label', subtitle: 'href'}},
})

// A home-page product card (8 on the live page). The photos rotate, so up to three.
export const productCard = defineType({
  name: 'productCard',
  title: 'Product card',
  type: 'object',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'priceLine', type: 'string', description: 'Shown as written, e.g. "Launch price TBA". Never a computed price.'}),
    defineField({name: 'badges', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'images', type: 'array', validation: (r) => r.max(3), of: [defineArrayMember({type: 'imageWithAlt'})]}),
    defineField({name: 'cta', type: 'ctaLink'}),
    defineField({name: 'product', type: 'reference', to: [{type: 'product'}], description: 'The product page the Learn More link goes to.'}),
  ],
  preview: {select: {title: 'name', subtitle: 'priceLine', media: 'images.0'}},
})

// ---- page sections ----
// Product, marketing and plain pages are ordered lists of these typed blocks.

export const richSection = defineType({
  name: 'richSection',
  title: 'Text section',
  type: 'object',
  fields: [
    eyebrow,
    anchorId,
    heading,
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'list', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'listStyle', type: 'string', options: {list: [{title: 'Bullets', value: 'bullets'}, {title: 'Crossed out', value: 'crossedOut'}]}, initialValue: 'bullets'}),
    defineField({name: 'closing', type: 'text', rows: 2}),
    defineField({name: 'image', type: 'imageWithAlt'}),
    defineField({name: 'imageSide', type: 'string', options: {list: ['left', 'right']}, initialValue: 'right'}),
  ],
  preview: titled('Text section'),
})

export const stepsSection = defineType({
  name: 'stepsSection',
  title: 'Steps',
  type: 'object',
  fields: [
    eyebrow,
    anchorId,
    heading,
    defineField({name: 'intro', type: 'text', rows: 3}),
    defineField({
      name: 'steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({name: 'marker', type: 'string', description: 'A number, time or label shown with the step (for example 7:02).'}),
            icon,
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'body', type: 'text', rows: 3}),
          ],
          preview: {select: {title: 'title', subtitle: 'body'}},
        }),
      ],
    }),
    defineField({name: 'closing', type: 'text', rows: 2}),
    defineField({
      name: 'callouts',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'callout',
          fields: [icon, defineField({name: 'title', type: 'string'}), defineField({name: 'body', type: 'text', rows: 3})],
          preview: {select: {title: 'title', subtitle: 'body'}},
        }),
      ],
    }),
  ],
  preview: titled('Steps'),
})

export const comparisonSection = defineType({
  name: 'comparisonSection',
  title: 'Comparison',
  type: 'object',
  fields: [
    anchorId,
    heading,
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
  preview: titled('Comparison'),
})

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to action',
  type: 'object',
  fields: [
    anchorId,
    heading,
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'cta', type: 'ctaLink'}),
    defineField({name: 'secondaryCta', type: 'ctaLink'}),
    defineField({name: 'footnote', type: 'string'}),
  ],
  preview: titled('Call to action'),
})

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  fields: [
    eyebrow,
    heading,
    defineField({name: 'lead', type: 'blockContent'}),
    defineField({name: 'ctas', type: 'array', of: [defineArrayMember({type: 'ctaLink'})]}),
    defineField({name: 'note', type: 'text', rows: 2, description: 'The small line under the buttons.'}),
    defineField({name: 'image', type: 'imageWithAlt'}),
    defineField({
      name: 'floatingSpecs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'floatingSpec',
          fields: [defineField({name: 'value', type: 'string'}), defineField({name: 'label', type: 'string'})],
          preview: {select: {title: 'value', subtitle: 'label'}},
        }),
      ],
    }),
    defineField({name: 'trustItems', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({
      name: 'storeBadges',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'storeBadge',
          fields: [defineField({name: 'prefix', type: 'string'}), defineField({name: 'label', type: 'string'})],
          preview: {select: {title: 'label', subtitle: 'prefix'}},
        }),
      ],
    }),
  ],
  preview: titled('Hero'),
})

export const statementSection = defineType({
  name: 'statementSection',
  title: 'Statement',
  type: 'object',
  fields: [anchorId, defineField({name: 'body', type: 'blockContent'}), defineField({name: 'chips', type: 'array', of: [defineArrayMember({type: 'string'})]})],
  preview: {prepare: () => ({title: 'Statement'})},
})

export const cardSection = defineType({
  name: 'cardSection',
  title: 'Cards',
  type: 'object',
  fields: [
    eyebrow,
    anchorId,
    heading,
    defineField({name: 'intro', type: 'blockContent'}),
    defineField({name: 'cards', type: 'array', of: [defineArrayMember({type: 'cardItem'})]}),
    defineField({name: 'miniItems', type: 'array', of: [defineArrayMember({type: 'miniItem'})]}),
    defineField({name: 'sourceNote', type: 'blockContent'}),
  ],
  preview: titled('Cards'),
})

export const specSection = defineType({
  name: 'specSection',
  title: 'Specifications',
  type: 'object',
  fields: [
    eyebrow,
    anchorId,
    heading,
    defineField({name: 'rows', type: 'array', of: [defineArrayMember({type: 'specRow'})]}),
    defineField({name: 'certs', type: 'array', of: [defineArrayMember({type: 'string'})], description: 'The certification chips under the table.'}),
  ],
  preview: titled('Specifications'),
})

export const relatedSection = defineType({
  name: 'relatedSection',
  title: 'Related links',
  type: 'object',
  fields: [
    eyebrow,
    anchorId,
    heading,
    defineField({name: 'intro', type: 'text', rows: 3}),
    defineField({
      name: 'items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'relatedItem',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({name: 'body', type: 'text', rows: 3}),
            defineField({name: 'linkLabel', type: 'string'}),
            defineField({name: 'href', type: 'string'}),
          ],
          preview: {select: {title: 'title', subtitle: 'linkLabel'}},
        }),
      ],
    }),
  ],
  preview: titled('Related links'),
})

export const accordionSection = defineType({
  name: 'accordionSection',
  title: 'Questions and answers',
  type: 'object',
  fields: [
    anchorId,
    heading,
    defineField({
      name: 'items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'accordionItem',
          fields: [defineField({name: 'question', type: 'string'}), defineField({name: 'answer', type: 'blockContent'})],
          preview: {select: {title: 'question'}},
        }),
      ],
    }),
  ],
  preview: titled('Questions and answers'),
})

// Marks where an interactive tool mounts in the page (the Fall Risk Check). The tool itself is code.
export const toolSection = defineType({
  name: 'toolSection',
  title: 'Tool',
  type: 'object',
  fields: [anchorId, defineField({name: 'tool', type: 'string', options: {list: [{title: 'Fall Risk Check', value: 'fallRisk'}]}, validation: (r) => r.required()})],
  preview: {select: {title: 'tool'}, prepare: ({title}: {title?: string}) => ({title: title || 'Tool', subtitle: 'Tool'})},
})

export const sectionTypes = [
  'heroSection',
  'statementSection',
  'richSection',
  'cardSection',
  'stepsSection',
  'comparisonSection',
  'specSection',
  'relatedSection',
  'accordionSection',
  'ctaSection',
  'toolSection',
]
