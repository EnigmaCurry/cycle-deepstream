import xs from 'xstream'
import { div, span, input } from '@cycle/dom'

function view() {
  return div("Hello, welcome.")
}

export function Home(sources) {
  const { DOM } = sources

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$
  }
}
