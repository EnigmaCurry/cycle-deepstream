import xs, { Stream } from 'xstream'
import { VNode, h, div, br, span, a, button, input } from '@cycle/dom'
import { PushHistoryInput } from '@cycle/history/lib'
import isolate from '@cycle/isolate'
import * as deepstream from '../actions/deepstream'
import { Location } from 'history'
import { Sources, Sinks, DeepstreamRequest } from '../types'
import { Post } from '../containers'

export function Home(sources: Sources): Sinks {
  const { DOM, history$, deep$, user$ } = sources

  // Instantiate the post listing once the user is logged in:
  const postListing$ = user$
    .filter(userData => userData !== null)
    .take(1)
    .map(userData => isolate(Post)(
      { ...sources, props$: xs.of({ id: 'main', expandChildren: 1 }) }))

  const vdom$ = postListing$
    .map(post => post.DOM)
    .flatten()

  const logout$ = DOM
    .select('.logout')
    .events('click')
    .map(ev => deepstream.logout())

  const postRequest$ = <Stream<DeepstreamRequest>>postListing$
    .map(post => post.deep$)
    .flatten()

  const request$ = xs.merge(logout$, postRequest$)

  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: request$
  }
}
