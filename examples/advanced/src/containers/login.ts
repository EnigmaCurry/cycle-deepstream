import xs from 'xstream'
import { Sources, Sinks } from '../types'
import * as navigation from '../actions/navigation'
import { div, span, button, input } from '@cycle/dom'

export function Login(sources: Sources): Sinks {
  const { DOM } = sources

  const navigation$ = DOM
    .select('.login')
    .events('click')
    .map(ev => navigation.push('/'))

  const vdom$ = xs.of(
    div(
      button(".login", {}, "Click here to login")
    )
  )

  return {
    DOM: vdom$,
    history$: navigation$
  }
}
