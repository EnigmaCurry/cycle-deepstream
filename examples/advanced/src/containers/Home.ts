import xs from 'xstream'
import { h, div, br, span, a, button, input } from '@cycle/dom'
import { PushHistoryInput } from '@cycle/history/lib'
import * as deepstream from '../actions/deepstream'
import { Sources, Sinks } from '../types'

function view(userData) {

  if (userData) {
    return div([
      h('h2.center', `Here's what's new, ${userData.name}`),
      h('paper-fab', { attrs: { icon: 'create' } }),
    ])
  } else {
    return div('')
  }
}

export function Home(sources: Sources): Sinks {
  const { DOM, history$, deep$ } = sources

  const loginState$ = xs.merge(
    deep$
      .filter(effect => effect.event === 'logout' || effect.event === 'login.failure')
      .mapTo(null),
    deep$
      .filter(effect => effect.event === 'login.success')
      .map(effect => effect.data))
    .startWith(null)

  const logout$ = DOM
    .select('.logout')
    .events('click')
    .map(ev => deepstream.logout())

  const vdom$ = loginState$
    .map(userData => view(userData))

  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: logout$
  }
}
