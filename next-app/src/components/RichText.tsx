import {PortableText, type PortableTextBlock, type PortableTextComponents} from 'next-sanity'
import {Fragment, type CSSProperties} from 'react'
import type {BlockContent, TableBlock} from '@/sanity/types'

export type RichTextProps = {
  value?: BlockContent
  /** Normal blocks render as their bare children, no <p> (a FAQ answer sits directly in its div). */
  bare?: boolean
  /** Live class names are not stored, so a page supplies them by node index; a run of list items counts as one node. */
  classes?: Record<number, string>
  /** Heading ids: h2 number n gets prefix + n (the legal pages link to #p1, #t1 ...). */
  h2IdPrefix?: string
  tableClass?: string
  linkStyle?: CSSProperties
  /** Inline style on the last node when it is a paragraph (the closing line of the terms). */
  lastStyle?: CSSProperties
}

/** A text field that can hold a deliberate line break. */
export function Multiline({text}: {text?: string}) {
  const lines = (text ?? '').split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  )
}

function Table({value, className}: {value: TableBlock; className?: string}) {
  const rows = value.rows ?? []
  const head = rows[0]?.cells?.length && rows[0].cells.every((c) => c.header) ? rows[0] : undefined
  const body = head ? rows.slice(1) : rows
  return (
    <table className={className}>
      {head && (
        <thead>
          <tr>
            {head.cells?.map((c) => (
              <th key={c._key} scope="col">
                {c.text}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {body.map((r) => (
          <tr key={r._key}>
            {r.cells?.map((c) =>
              c.header ? (
                <th key={c._key} scope="row">
                  {c.text}
                </th>
              ) : (
                <td key={c._key}>{c.text}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** A deliberate line break stored at the end of a bold span ("Title\n") belongs after the bold, as on the live page. */
function breaksOutsideMarks(blocks: BlockContent): BlockContent {
  return blocks.map((b) => {
    if (b._type !== 'block' || !b.children) return b
    const children = b.children.flatMap((c, i) => {
      const m = /^(.*?)(\n+)$/s.exec(c.text ?? '')
      if (!m || !c.marks?.length || !m[1]) return [c]
      return [
        {...c, text: m[1]},
        {...c, _key: `${c._key}-br${i}`, text: m[2], marks: []},
      ]
    })
    return {...b, children}
  })
}

/** How many top-level nodes the blocks render as: a run of list items is one node. */
export function nodeCount(blocks: BlockContent = []) {
  let count = 0
  let prevList: string | undefined
  for (const b of blocks) {
    const list = b._type === 'block' ? b.listItem : undefined
    if (!list || list !== prevList) count++
    prevList = list
  }
  return count
}

export function RichText({value, bare, classes, h2IdPrefix, tableClass, linkStyle, lastStyle}: RichTextProps) {
  if (!value?.length) return null
  const blocks = breaksOutsideMarks(value)
  const lastNode = nodeCount(blocks) - 1
  const h2Number = new Map<string, number>()
  let n = 0
  for (const b of blocks) if (b._type === 'block' && b.style === 'h2') h2Number.set(b._key, ++n)

  // External links open in a new tab. Source notes (the regulatory references) are nofollow; the legal pages' links are not.
  const marks = (rel: string): PortableTextComponents['marks'] => ({
    sub: ({children}) => <sub>{children}</sub>,
    link: ({value: v, children}) => {
      const href: string = v?.href ?? ''
      const external = /^https?:\/\//.test(href)
      return (
        <a href={href} style={linkStyle} {...(external ? {rel, target: '_blank'} : {})}>
          {children}
        </a>
      )
    },
  })
  // A source note is a div with its text directly inside, and the live note uses <b> (styles.css targets .source-note b).
  const noteComponents: PortableTextComponents = {block: {normal: ({children}) => <>{children}</>}, marks: {...marks('nofollow noopener'), strong: ({children}) => <b>{children}</b>}}

  const components: PortableTextComponents = {
    block: {
      normal: ({children, index}) => (bare ? <>{children}</> : <p className={classes?.[index]} style={index === lastNode ? lastStyle : undefined}>{children}</p>),
      h2: ({children, index, value: v}) => (
        <h2 id={h2IdPrefix ? `${h2IdPrefix}${h2Number.get(v._key ?? '')}` : undefined} className={classes?.[index]}>
          {children}
        </h2>
      ),
      h3: ({children, index}) => <h3 className={classes?.[index]}>{children}</h3>,
      sourceNote: ({value: v}) => (
        <div className="source-note">
          <PortableText value={[{...v, style: 'normal'}]} components={noteComponents} />
        </div>
      ),
    },
    list: {
      bullet: ({children, index}) => <ul className={classes?.[index]}>{children}</ul>,
      number: ({children, index}) => <ol className={classes?.[index]}>{children}</ol>,
    },
    marks: marks('noopener'),
    types: {
      tableBlock: ({value: v}) => <Table value={v as TableBlock} className={tableClass} />,
    },
  }

  return <PortableText value={blocks as PortableTextBlock[]} components={components} />
}
