import xs from 'xstream'
import { div, span, input } from '@cycle/dom'

function view() {
  return div("Login here now!")
}

export function Login(sources) {
  const { DOM } = sources

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$
  }
}
