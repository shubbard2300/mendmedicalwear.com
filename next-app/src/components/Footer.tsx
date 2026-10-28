import {Fragment} from 'react'
import type {PageMenu} from './Header'

// The live separator between footer links is a space, a non-breaking space, a middle dot, a non-breaking space and a space.
const SEPARATOR = '  ·  '

export function Footer({note, copyright, menu}: {note?: string; copyright?: string; menu: PageMenu}) {
  return (
    <footer>
      <p>{note}</p>
      <p>{copyright}</p>
      <p>
        {menu?.items?.map((item, i) => (
          <Fragment key={item._key}>
            {i > 0 && SEPARATOR}
            <a href={item.href}>{item.label}</a>
          </Fragment>
        ))}
      </p>
    </footer>
  )
}
