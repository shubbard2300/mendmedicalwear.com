import {defineArrayMember, defineField, defineType} from 'sanity'
import {sectionTypes} from './objects'

// See the lock list at the top of objects.ts. Slugs keep the live URL spelling exactly:
// product slugs are lowercase (/products/compression-socks); the page slugs "FAQ" and "Privacy-Terms"
// are capitalized public URLs and Next.js routes are case-sensitive.

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({name: 'order', type: 'number', description: 'Position in the homepage cards and the sitemap.'}),
    defineField({name: 'tagline', type: 'string'}),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: [{title: 'Pre-order', value: 'preorder'}, {title: 'Waitlist', value: 'waitlist'}]},
    }),
    defineField({name: 'priceText', type: 'string', description: 'Shown as written, e.g. "Launch price TBA". Never a computed or struck-through price.'}),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({
      name: 'gallery',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'galleryImage',
          fields: [
            defineField({name: 'image', type: 'imageWithAlt'}),
            defineField({name: 'variant', type: 'string', description: 'Color, fit or view this photo belongs to, if any.'}),
          ],
          preview: {select: {title: 'variant', media: 'image'}},
        }),
      ],
    }),
    defineField({
      name: 'variantGroups',
      type: 'array',
      description: 'Color, size and fit pickers.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'variantGroup',
          fields: [
            defineField({name: 'name', type: 'string', description: 'For example Color, Size, Fit.'}),
            defineField({name: 'options', type: 'array', of: [defineArrayMember({type: 'string'})]}),
          ],
          preview: {select: {title: 'name'}},
        }),
      ],
    }),
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
    defineField({name: 'sections', type: 'array', of: sectionTypes.map((type) => defineArrayMember({type}))}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'tagline', media: 'heroImage'}},
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ item',
  type: 'document',
  fields: [
    defineField({name: 'question', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'answer', type: 'blockContent', validation: (r) => r.required()}),
    defineField({name: 'group', type: 'string', description: 'The heading this question sits under on the FAQ page.'}),
    defineField({name: 'order', type: 'number'}),
  ],
  orderings: [{title: 'Order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'question', subtitle: 'group'}},
})

// Plain pages: Privacy-Terms, facilities and the FAQ page shell (title, intro, SEO; the questions are faqItem documents).
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Keep the live spelling and capitalization exactly (FAQ, Privacy-Terms, facilities).',
      validation: (r) => r.required().custom((s) => (!s?.current || /^[A-Za-z0-9-]+$/.test(s.current) ? true : 'Letters, numbers and hyphens only')),
    }),
    defineField({name: 'body', type: 'blockContent'}),
    defineField({name: 'sections', type: 'array', of: sectionTypes.map((type) => defineArrayMember({type}))}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'slug.current'}},
})

// Singletons: one document each, fixed ids (see structure.ts).
export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({name: 'heroHeading', type: 'string'}),
    defineField({name: 'heroSubheading', type: 'text', rows: 3}),
    defineField({name: 'heroImage', type: 'imageWithAlt'}),
    defineField({name: 'primaryCta', type: 'ctaLink'}),
    defineField({name: 'secondaryCta', type: 'ctaLink'}),
    defineField({
      name: 'featuredProducts',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'product'}]})],
    }),
    defineField({name: 'sections', type: 'array', of: sectionTypes.map((type) => defineArrayMember({type}))}),
    defineField({name: 'seo', type: 'seo'}),
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
    defineField({
      name: 'nav',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navItem',
          fields: [defineField({name: 'label', type: 'string'}), defineField({name: 'href', type: 'string'})],
          preview: {select: {title: 'label', subtitle: 'href'}},
        }),
      ],
    }),
    defineField({name: 'footerNote', type: 'text', rows: 3}),
    defineField({name: 'socialCard', type: 'imageWithAlt', description: 'Default Open Graph and Twitter image.'}),
    defineField({name: 'defaultSeo', type: 'seo'}),
  ],
  preview: {prepare: () => ({title: 'Site settings'})},
})
