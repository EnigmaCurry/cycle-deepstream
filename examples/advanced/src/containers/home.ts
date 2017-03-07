import xs from 'xstream'
import { div, span, a, input } from '@cycle/dom'

function view() {
  return div(
    a(".login", { attrs: { href: "/login" } }, "Click here to go to login page")
  )
}

export function Home(sources) {
  const { DOM } = sources

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$
  }
}
