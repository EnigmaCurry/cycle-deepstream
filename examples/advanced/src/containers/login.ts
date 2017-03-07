import xs from 'xstream'
import { div, span, a, input } from '@cycle/dom'

function view() {
  return div(
    a(".login", { attrs: { href: "/" } }, "Click here to go to the home page")
  )
}

export function Login(sources) {
  const { DOM } = sources

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$
  }
}
