import xs from 'xstream'
import { div, br, span, a, button, input } from '@cycle/dom'
import { PushHistoryInput } from '@cycle/history/lib'
import { Sources, Sinks } from '../types'

function view() {
  return div([
    a('.login', { attrs: { href: '/login' } }, 'Default click handler')
  ])
}

export function Home(sources: Sources): Sinks {
  const { DOM, history$ } = sources

  const vdom$ = xs.of(view())
  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$
  }
}
