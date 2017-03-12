import xs from 'xstream'
import * as deepstream from '../actions/deepstream'
import { VNode, h } from '@cycle/dom'
import { Sources, Sinks } from '../types'
import * as Markdown from 'markdown-it'
import { toVNode } from 'snabbdom/tovnode'

const markdown = new Markdown()

function view(post) {
  //Render post content from markdown to HTML.
  const content = markdown.render(post.content)
  //Manually create a DOM element and corece it into a snabbdom VNode:
  const elm = document.createElement('div')
  elm.innerHTML = content
  return toVNode(elm)
}

export function Post(sources: Sources): Sinks {
  const { DOM, deep$, props$ } = sources

  const deletedPost = {
    content: '[deleted]'
  }

  // Output the post when it come back from deepstream -
  // If the post is ever deleted, hide the post:
  const vdom$ = xs.combine(props$, deep$)
    .filter(([props, effect]) => effect.name === props.id)
    .map(([props, effect]) => effect)
    .filter(effect => effect.event === 'record.change' ||
      effect.event === 'record.delete')
    .map(effect => view(
      effect.event === 'record.delete' ? deletedPost : effect.data))
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
