import xs from 'xstream'
import * as deepstream from '../actions/deepstream'
import { h } from '@cycle/dom'
import { Sources, Sinks } from '../types'

function view(post) {
  return h('div', JSON.stringify(post))
}

export function Post(sources: Sources): Sinks {
  const { DOM, deep$, props$ } = sources

  const vdom$ = xs.combine(props$, deep$)
    .filter(([props, effect]) => effect.name === props.id)
    .filter(([props, effect]) => effect.event === 'record.change' ||
      effect.event === 'record.delete')
    .map(([props, effect]) => view(
      effect.event === 'record.delete' ? '[deleted]' : effect.data))
    .startWith(h('div', 'loading...'))

  // Request the post specified in props.id
  const requestPost$ = props$
    .map(({ id }) => deepstream.subscribe(id))

  return {
    DOM: vdom$,
    deep$: requestPost$,
    history$: xs.never()
  }
}
