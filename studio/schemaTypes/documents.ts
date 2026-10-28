import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionTypes} from './objects'

// See the lock list at the top of objects.ts. Slugs keep the live URL spelling exactly:
// product slugs are lowercase (/products/compression-socks); the page slugs "FAQ" and "Privacy-Terms"
// are capitalized public URLs and Next.js routes are case-sensitive.

const sections = defineField({name: 'sections', type: 'array', of: sectionTypes.map((type) => defineArrayMember({type}))})

// The live nav and footer are not one shared block: 8 nav versions and 10 footer versions across the 12 pages.
// Reusable menus carry the links; the product-specific footer line sits on each page or product.
const chrome = [
  defineField({name: 'navMenu', type: 'reference', to: [{type: 'menu'}], options: {filter: 'kind == "nav"'}}),
  defineField({name: 'footerMenu', type: 'reference', to: [{type: 'menu'}], options: {filter: 'kind == "footer"'}}),
  defineField({name: 'footerNote', type: 'text', rows: 3, description: 'The line before the copyright in this page footer (pre-order notice, pending-clearance notice, tagline).'}),
]

export const menu = defineType({
  name: 'menu',
  title: 'Menu',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', description: 'Internal name, e.g. "Nav: apparel product pages".', validation: (r) => r.required()}),
    defineField({name: 'kind', type: 'string', options: {list: [{title: 'Header nav', value: 'nav'}, {title: 'Footer links', value: 'footer'}]}, validation: (r) => r.required()}),
    defineField({name: 'items', type: 'array', of: [defineArrayMember({type: 'menuItem'})]}),
    defineField({name: 'cta', type: 'ctaLink', description: 'The button at the end of the nav, if any.'}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind'}},
})

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({name: 'order', type: 'number', description: 'Position in the sitemap.'}),
    defineField({name: 'tagline', type: 'string', description: 'The subtitle under the product name.'}),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: [{title: 'Pre-order', value: 'preorder'}, {title: 'Waitlist', value: 'waitlist'}]},
    }),
    defineField({name: 'priceText', type: 'string', description: 'Shown as written, e.g. "Launch price TBA". Never a computed or struck-through price.'}),
    defineField({
      name: 'schemaKind',
      type: 'string',
      description: 'The JSON-LD type for this page.',
      options: {list: [{title: 'Product', value: 'product'}, {title: 'Software application', value: 'software'}]},
    }),
    defineField({
      name: 'offerKind',
      type: 'string',
      description: 'The JSON-LD offer. "free" is the MEND App; no amounts can be typed here on purpose.',
      options: {list: [{title: 'Pre-order', value: 'preOrder'}, {title: 'Free', value: 'free'}, {title: 'None', value: 'none'}]},
    }),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({
      name: 'imageMatrix',
      type: 'array',
      description: 'Every product photo and what it shows. The picker on the page chooses a photo from these fields.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'matrixImage',
          fields: [
            defineField({name: 'gender', type: 'string', options: {list: ['female', 'male']}}),
            defineField({name: 'view', type: 'string', options: {list: ['front', 'back', 'pockets', 'detail']}}),
            defineField({name: 'closure', type: 'string', description: 'Gown only: which zip the photo shows.', options: {list: ['front', 'back']}}),
            defineField({name: 'color', type: 'string', description: 'The option value of the color this photo shows; empty for the default color.'}),
            defineField({name: 'label', type: 'string', description: 'A caption such as "Non-Slip Sole Detail", for photos without a gender or view.'}),
            defineField({name: 'image', type: 'imageWithAlt'}),
          ],
          preview: {
            select: {gender: 'gender', view: 'view', closure: 'closure', color: 'color', label: 'label', media: 'image'},
            prepare: ({gender, view, closure, color, label, media}) => ({
              title: label || [gender, view, closure && `${closure} zip`, color].filter(Boolean).join(' / ') || 'Photo',
              media,
            }),
          },
        }),
      ],
    }),
    defineField({name: 'description', type: 'blockContent'}),
    defineField({name: 'bundleNote', type: 'text', rows: 3, description: 'The cross-sell line under the buttons.'}),
    defineField({name: 'banner', type: 'text', rows: 3, description: 'The coming-soon banner (AirGuard).'}),
    defineField({
      name: 'badges',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'badge',
          fields: [defineField({name: 'label', type: 'string'}), defineField({name: 'tooltip', type: 'text', rows: 2})],
          preview: {select: {title: 'label', subtitle: 'tooltip'}},
        }),
      ],
    }),
    defineField({
      name: 'variantGroups',
      type: 'array',
      description: 'Color, size, fit and closure pickers.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'variantGroup',
          fields: [
            defineField({name: 'name', type: 'string', description: 'The label above the picker, for example Color, Size, Fit, Closure Style.'}),
            defineField({name: 'kind', type: 'string', options: {list: ['color', 'size', 'fit', 'closure']}}),
            defineField({
              name: 'options',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'variantOption',
                  fields: [
                    defineField({name: 'label', type: 'string', description: 'What the button or swatch is called.'}),
                    defineField({name: 'value', type: 'string', description: 'The value the page and the lead form use (empty for the default color).'}),
                    defineField({name: 'tooltip', type: 'text', rows: 2}),
                    defineField({name: 'swatchColor', type: 'string', description: 'Hex color for a color swatch.'}),
                    defineField({name: 'pattern', type: 'string', description: 'For a patterned swatch instead of a plain color.', options: {list: ['print', 'stripe']}}),
                  ],
                  preview: {select: {title: 'label', subtitle: 'tooltip'}},
                }),
              ],
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'kind'}},
        }),
      ],
    }),
    defineField({
      name: 'pickerNotes',
      type: 'object',
      description: 'Lines that change when the closure or view changes (gown).',
      fields: [
        defineField({
          name: 'closureNotes',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'closureNote',
              fields: [defineField({name: 'closure', type: 'string', options: {list: ['front', 'back']}}), defineField({name: 'text', type: 'string'})],
              preview: {select: {title: 'closure', subtitle: 'text'}},
            }),
          ],
        }),
        defineField({
          name: 'viewNotes',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'viewNote',
              fields: [
                defineField({name: 'closure', type: 'string', options: {list: ['front', 'back']}}),
                defineField({name: 'view', type: 'string', options: {list: ['front', 'back']}}),
                defineField({name: 'text', type: 'string'}),
              ],
              preview: {select: {title: 'text', subtitle: 'view'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'sizeGuide',
      type: 'object',
      fields: [
        defineField({name: 'summary', type: 'string', description: 'The label on the toggle, for example Size guide.'}),
        defineField({name: 'tables', type: 'array', of: [defineArrayMember({type: 'tableBlock'})]}),
        defineField({name: 'note', type: 'text', rows: 3}),
      ],
    }),
    defineField({name: 'ctas', type: 'array', description: 'The buttons next to the options (Pre-Order Now, Save for Later, Notify Me at Launch).', of: [defineArrayMember({type: 'ctaLink'})]}),
    defineField({
      name: 'specs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'spec',
          fields: [defineField({name: 'label', type: 'string'}), defineField({name: 'value', type: 'string'})],
          preview: {select: {title: 'label', subtitle: 'value'}},
        }),
      ],
    }),
    sections,
    defineField({name: 'seo', type: 'seo'}),
    ...chrome,
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'tagline', media: 'heroImage'}},
})

export const faqGroup = defineType({
  name: 'faqGroup',
  title: 'FAQ group',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'anchorId', type: 'string', description: 'The #id the FAQ chips jump to (preorders, products, airguard...).', validation: (r) => r.required()}),
    defineField({name: 'order', type: 'number'}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'anchorId'}},
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'document',
  fields: [
    defineField({name: 'question', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', type: 'blockContent', validation: (r) => r.required()}),
    defineField({name: 'group', type: 'reference', to: [{type: 'faqGroup'}], validation: (r) => r.required()}),
    defineField({name: 'order', type: 'number'}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'question', subtitle: 'group.title'}},
})

// Plain pages: Privacy-Terms, facilities, Fall Risk and the FAQ page shell (title, intro, SEO; the questions are faqItem documents).
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Keep the live spelling and capitalization exactly (FAQ, Privacy-Terms, facilities, fall-risk-assessment).',
      validation: (r) => r.required().custom((s) => (!s?.current || /^[A-Za-z0-9-]+$/.test(s.current) ? true : 'Letters, numbers and hyphens only')),
    }),
    defineField({name: 'body', type: 'blockContent'}),
    sections,
    defineField({name: 'seo', type: 'seo'}),
    ...chrome,
  ],
  preview: {select: {title: 'title', subtitle: 'slug.current'}},
})

// Singletons: one document each, fixed ids (see structure.ts).
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroBanner',
      type: 'object',
      description: 'The full-width banner with rotating photos and the two buttons.',
      fields: [
        defineField({name: 'slides', type: 'array', of: [defineArrayMember({type: 'imageWithAlt'})]}),
        defineField({name: 'eyebrow', type: 'string'}),
        defineField({name: 'heading', type: 'text', rows: 2}),
        defineField({name: 'body', type: 'text', rows: 3}),
        defineField({name: 'ctas', type: 'array', of: [defineArrayMember({type: 'ctaLink'})]}),
      ],
    }),
    defineField({
      name: 'carousel',
      type: 'array',
      description: 'The product slides under the banner. The first slide carries the page h1.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'carouselSlide',
          fields: [
            defineField({name: 'eyebrow', type: 'string'}),
            defineField({name: 'heading', type: 'text', rows: 2}),
            defineField({name: 'body', type: 'text', rows: 3}),
            defineField({name: 'ctas', type: 'array', of: [defineArrayMember({type: 'ctaLink'})]}),
            defineField({name: 'image', type: 'imageWithAlt'}),
          ],
          preview: {select: {title: 'heading', subtitle: 'eyebrow', media: 'image'}},
        }),
      ],
    }),
    defineField({
      name: 'about',
      type: 'object',
      fields: [
        defineField({name: 'images', type: 'array', of: [defineArrayMember({type: 'imageWithAlt'})]}),
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'body', type: 'blockContent'}),
        defineField({name: 'list', type: 'array', of: [defineArrayMember({type: 'string'})]}),
      ],
    }),
    defineField({
      name: 'productsSection',
      type: 'object',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'intro', type: 'text', rows: 3}),
        defineField({name: 'featureImage', type: 'imageWithAlt'}),
        defineField({name: 'cards', type: 'array', of: [defineArrayMember({type: 'productCard'})]}),
      ],
    }),
    defineField({
      name: 'partners',
      type: 'object',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'intro', type: 'text', rows: 3}),
        defineField({
          name: 'cards',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'partnerCard',
              fields: [
                defineField({name: 'eyebrow', type: 'string'}),
                defineField({name: 'heading', type: 'string'}),
                defineField({name: 'body', type: 'text', rows: 4}),
                defineField({name: 'ctas', type: 'array', of: [defineArrayMember({type: 'ctaLink'})]}),
              ],
              preview: {select: {title: 'heading', subtitle: 'eyebrow'}},
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'contact',
      type: 'object',
      description: 'Copy only. The form fields and their labels are code.',
      fields: [
        defineField({name: 'heading', type: 'string'}),
        defineField({name: 'intro', type: 'text', rows: 3}),
        defineField({
          name: 'details',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'contactDetail',
              fields: [
                defineField({name: 'label', type: 'string'}),
                defineField({name: 'text', type: 'text', rows: 3}),
                defineField({name: 'cta', type: 'ctaLink'}),
              ],
              preview: {select: {title: 'label', subtitle: 'text'}},
            }),
          ],
        }),
        defineField({name: 'privacyNote', type: 'text', rows: 3}),
      ],
    }),
    defineField({name: 'seo', type: 'seo'}),
    ...chrome,
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({name: 'siteName', type: 'string', initialValue: 'MEND Medical Apparel'}),
    defineField({name: 'contactEmail', type: 'string', description: 'The public contact address already on the live site.'}),
    defineField({name: 'phone', type: 'string', description: 'The public business phone already on the live site.'}),
    defineField({name: 'copyright', type: 'string', description: 'The copyright line shared by every footer, as written.'}),
    defineField({name: 'organizationDescription', type: 'text', rows: 3, description: 'The description in the Organization JSON-LD.'}),
    defineField({name: 'socialCard', type: 'imageWithAlt', description: 'Default Open Graph and Twitter image.'}),
    defineField({name: 'defaultSeo', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
