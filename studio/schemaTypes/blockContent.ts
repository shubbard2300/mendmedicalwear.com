import {defineArrayMember, defineType} from 'sanity'

// Portable text used for body copy, FAQ answers, legal pages and long product text.
// Deliberately plain: the live copy is paragraphs, two heading levels, lists, bold, italic, subscript (SpO₂-style
// text), inline code (one utm_source in Privacy-Terms), links, a source-note paragraph style and tables.
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        // The regulatory "what this means here" note under some feature and FAQ text: bold lead-in, text, a link.
        {title: 'Source note', value: 'sourceNote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
          {title: 'Subscript', value: 'sub'},
          {title: 'Code', value: 'code'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{name: 'href', type: 'string', title: 'URL or path', validation: (r) => r.required()}],
          },
        ],
      },
    }),
    defineArrayMember({type: 'tableBlock'}),
  ],
})
