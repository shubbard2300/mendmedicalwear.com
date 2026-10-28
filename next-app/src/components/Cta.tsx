import type {CtaLink} from '@/sanity/types'

// A button that opens a lead form (behavior arrives in P4) or a plain link. The live class names are not stored; the caller supplies them.
export function Cta({cta, className, id}: {cta: CtaLink; className: string; id?: string}) {
  if (cta.modal) {
    return (
      <button type="button" id={id} className={className} data-modal={cta.modal} data-product={cta.product || undefined}>
        {cta.label}
      </button>
    )
  }
  return (
    <a id={id} className={className} href={cta.href}>
      {cta.label}
    </a>
  )
}
