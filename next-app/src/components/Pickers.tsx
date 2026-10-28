import {imageUrl} from '@/sanity/image'
import type {PRODUCT_QUERY_RESULT, TableBlock} from '@/sanity/types'
import {findPhoto} from './Pdp'
import {SanityImage} from './SanityImage'

type Product = NonNullable<PRODUCT_QUERY_RESULT>
export type Group = NonNullable<Product['variantGroups']>[number]
type Options = NonNullable<Group['options']>

// The option pickers of the apparel pages, in the starting state the live pages ship (first fit, color and closure selected, women's size M);
// behavior arrives in P4. The documents store the options, their tooltips and the tables. These rules derive what the live markup adds:
// each swatch's aria label (the label minus a trailing parenthetical), the size button titles, the default selections, which groups start hidden.

export function groupsOf(product: Product, kind: NonNullable<Group['kind']>): Group[] {
  const groups = (product.variantGroups ?? []).filter((g) => g.kind === kind)
  if (!groups.length) throw new Error(`${product.slug.current}: no ${kind} option group`)
  return groups
}

const optionsOf = (g: {options?: Options} | undefined): Options => g?.options ?? []

export function FitPicker({group}: {group: Group}) {
  const options = optionsOf(group)
  return (
    <div className="option-group">
      <label>
        {group.name} — <span id="genderLabel">{options[0]?.label}</span>
      </label>
      <div className="genders" id="genderGroup">
        {options.map((o, i) => (
          <button key={o._key} type="button" className={i === 0 ? 'gender-btn active' : 'gender-btn'} data-gender={o.value} aria-pressed={i === 0 ? 'true' : 'false'}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** `showValue`: the label also shows the selected color ("Color — Soft Sage", the scrubs); without it the label is the group name (the gown). */
export function ColorPicker({group, showValue}: {group: Group; showValue?: boolean}) {
  const options = optionsOf(group)
  return (
    <div className="option-group">
      <label>
        {group.name}
        {showValue && (
          <>
            {' — '}
            <span id="colorLabel">{options[0]?.label}</span>
          </>
        )}
      </label>
      <div className="swatches">
        {options.map((o, i) => {
          const patternClass = o.pattern === 'print' ? 'swatch-pattern' : o.pattern === 'stripe' ? 'swatch-stripe' : undefined
          return (
            <button
              key={o._key}
              type="button"
              className={['swatch', i === 0 && 'active', patternClass].filter(Boolean).join(' ')}
              style={o.swatchColor ? {background: o.swatchColor} : undefined}
              data-color={o.value ?? ''}
              {...(showValue ? {'data-color-label': o.label, 'data-color-suffix': i === 0 ? '' : ` - ${o.value}`} : {})}
              title={o.label}
              aria-label={o.label?.replace(/\s*\([^)]*\)\s*$/, '')}
              data-tooltip={o.tooltip}
            ></button>
          )
        })}
      </div>
    </div>
  )
}

/** The socks' color row: a swatch is a button with the color, the photo's address (`data-src`) and a title, and nothing else. */
export function SockColorPicker({group, matrix}: {group: Group; matrix: Product['imageMatrix']}) {
  const options = optionsOf(group)
  return (
    <div className="option-group">
      <label>
        {group.name} — <span id="colorLabel" className="color-label-value">{options[0]?.label}</span>
      </label>
      <div className="swatches">
        {options.map((o, i) => {
          const ref = findPhoto(matrix, {color: o.value}).image?.asset?._ref
          return (
            <button
              key={o._key}
              type="button"
              className={i === 0 ? 'swatch active' : 'swatch'}
              style={{background: o.swatchColor}}
              data-color={o.value}
              data-src={ref ? imageUrl(ref) : undefined}
              title={o.label}
            ></button>
          )
        })}
      </div>
    </div>
  )
}

/** The socks' size row: plain buttons, one selected. */
export function SockSizePicker({group, defaultSize}: {group: Group; defaultSize: string}) {
  return (
    <div className="option-group">
      <label>{group.name}</label>
      <div className="sizes">
        {optionsOf(group).map((o) => (
          <button key={o._key} type="button" className={o.label === defaultSize ? 'size-btn active' : 'size-btn'}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ClosurePicker({group, note}: {group: Group; note?: string}) {
  return (
    <div className="option-group">
      <label>{group.name}</label>
      <div className="sizes" id="closureGroup">
        {optionsOf(group).map((o, i) => (
          <button key={o._key} type="button" className={i === 0 ? 'size-btn active' : 'size-btn'} data-tooltip={o.tooltip}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="closure-note" id="closureNote">
        {note}
      </div>
    </div>
  )
}

// The live size tables are written without a <tbody> and a browser adds one; React must emit it, or the browser's copy and React's disagree
// and React rebuilds the table on the client (hydration error #418).
function GuideTable({table}: {table: TableBlock}) {
  return (
    <table>
      <tbody>
        {table.rows?.map((row) => (
          <tr key={row._key}>{row.cells?.map((c) => (c.header ? <th key={c._key}>{c.text}</th> : <td key={c._key}>{c.text}</td>))}</tr>
        ))}
      </tbody>
    </table>
  )
}

/** Women's sizes (the first group) and men's sizes (hidden), then the size guide with one table per fit. */
export function SizePicker({groups, guide, defaultSize}: {groups: Group[]; guide: Product['sizeGuide']; defaultSize: string}) {
  const fit = (g: Group) => (g.name ?? '').replace(/^[^—]*— /, '')
  return (
    <div className="option-group">
      <label>
        {(groups[0].name ?? '').split(' — ')[0]} — <span id="sizeFitLabel">{fit(groups[0])}</span>
      </label>
      {groups.map((g, gi) => (
        <div className="sizes" id={gi === 0 ? 'sizesFemale' : 'sizesMale'} hidden={gi > 0} key={g._key}>
          {optionsOf(g).map((o) => (
            <button key={o._key} type="button" className={gi === 0 && o.label === defaultSize ? 'size-btn active' : 'size-btn'} title={`${fit(g)} ${o.label}`} data-tooltip={o.tooltip}>
              {o.label}
            </button>
          ))}
        </div>
      ))}
      <details className="size-guide">
        <summary>{guide?.summary}</summary>
        {guide?.tables?.map((t, ti) => (
          <div id={ti === 0 ? 'guideFemale' : 'guideMale'} hidden={ti > 0} key={t._key}>
            <GuideTable table={t} />
          </div>
        ))}
        <p className="size-note">{guide?.note}</p>
      </details>
    </div>
  )
}

/** The scrubs' bundle offer: the socks, with a checkbox and the sock colors (taken from the socks product), hidden until the P4 behavior. */
export function BundleOffer({offer, defaultColor}: {offer: NonNullable<Product['bundleOffer']>; defaultColor: string}) {
  const colors = optionsOf(offer.product?.variantGroups?.find((g) => g.kind === 'color'))
  if (!colors.length) throw new Error('The bundle offer has no sock colors')
  return (
    <div className="bundle-upsell">
      <div className="bundle-upsell-thumb">
        <SanityImage image={offer.image} id="bundleThumb" sourceId="bundleThumbSrc" />
      </div>
      <div className="bundle-upsell-info">
        <div className="bundle-upsell-label">{offer.eyebrow}</div>
        <div className="bundle-upsell-name">{offer.productName}</div>
        <div className="bundle-upsell-desc">{offer.description}</div>
        <label className="bundle-upsell-toggle">
          <input type="checkbox" id="bundleToggle" /> <span className="bundle-badge">{offer.checkboxLabel}</span>
        </label>
        <div className="bundle-color" id="bundleColor" hidden>
          <div className="bundle-color-label">
            {offer.colorLabel} <span id="bundleColorLabel">{defaultColor}</span>
          </div>
          <div className="bundle-swatches" id="bundleSwatches">
            {colors.map((o) => {
              const name = o.value ?? o.label
              return (
                <button
                  key={o._key}
                  type="button"
                  className={name === defaultColor ? 'bundle-swatch active' : 'bundle-swatch'}
                  style={{background: o.swatchColor}}
                  data-sock={name}
                  title={o.label}
                  aria-label={`${o.label} socks`}
                  aria-pressed={name === defaultColor ? 'true' : 'false'}
                ></button>
              )
            })}
          </div>
          <div className="bundle-color-note">{offer.colorNote}</div>
        </div>
      </div>
    </div>
  )
}
