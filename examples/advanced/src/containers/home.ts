import xs from 'xstream'
import { div, br, span, a, button, input } from '@cycle/dom'
import { PushHistoryInput } from '@cycle/history/lib'
import * as deepstream from '../actions/deepstream'
import { Sources, Sinks } from '../types'

function view() {
  return div([
    a('.logout', { attrs: { href: '' } }, 'logout')
  ])
}

export function Home(sources: Sources): Sinks {
  const { DOM, history$ } = sources

  const logout$ = DOM
    .select('.logout')
    .events('click')
    .map(ev => deepstream.logout())

  const vdom$ = xs.of(view())
  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: logout$
  }
}
