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

  // Rerender the post listing when a user logs in:
  const postListing$ = user$
    .filter(userData => userData !== null)
    .map(userData => isolate(Post)(
      { ...sources, props$: xs.of({ id: 'p/main', expandChildren: 1 }) }))

  const vdom$ = postListing$
    .map(post => post.DOM)
    .flatten()

  // Connect Post.deep$ to Home.deep$ to allow it to fetch data and
  // receive events:
  const postRequest$ = <Stream<DeepstreamRequest>>postListing$
    .map(post => post.deep$)
    .flatten()

  return {
    DOM: vdom$,
    history$: xs.never(),
    deep$: postRequest$
  }
}
