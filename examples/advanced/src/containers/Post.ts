import xs, { Stream } from 'xstream'
import * as ds from '../actions/deepstream'
import { VNode, h } from '@cycle/dom'
import isolate from '@cycle/isolate'
import Collection from '@cycle/collection'
import { Sources, Sinks, DeepstreamRequest } from '../types'
import * as Markdown from 'markdown-it'
import { toVNode } from 'snabbdom/tovnode'
import _ from 'lodash'

const markdown = new Markdown()

type PostRecord = {
  content: string
}

function view(post: PostRecord) {
  //Render post content from markdown to HTML.
  const content = markdown.render(post.content ? post.content : 'Nothing here')
  //Manually create a DOM element and corece it into a snabbdom VNode:
  const elm = document.createElement('div')
  elm.innerHTML = content
  return toVNode(elm)
}

//Construct a Post and its children's Posts recursively:
// Post is composed of the following:
//  - Text content
//  - metadata about the post (author, date, etc)
//  - A list of sub Posts.
// Posts are thus fractal:
//  - Each Post maintains it's own subscription to it's content and its
//    own list of children.
//  - Each Post is responsible for creating it's children containers and
//    hooking it up to it's parent Post's sinks.
export function Post(sources: Sources): Sinks {
  const { DOM, deep$, props$ } = sources

  const request$ = xs.merge(
    // Request the post specified in props.id
    props$.map(({ id }) => ds.record.subscribe(id)),
    // Request the list of children posts:
    // We pass list.change=false beause we only need list.entry-* events.
    props$.map(({id}) => ds.list.subscribe(`${id}/children`, { 'list.change': false }))
  )

  // Receive stream of changes to post data:
  const post$ = xs.combine(props$, deep$)
    .filter(([props, effect]) => effect.name === props.id)
    .map(([props, effect]) => effect)
    .filter(effect => effect.event === 'record.change' ||
      effect.event === 'record.delete')
    .map(effect => effect.event === 'record.delete' ?
      { content: '[deleted]' } : effect.data)
    .startWith({ content: "Loading post ..." })

  const postChildren$ = xs.combine(props$, deep$)
    .filter(([props, effect]) => effect.name === `${props.id}/children`)
    .map(([props, effect]) => effect)
    .filter(effect => effect.event === 'list.change')

  // // Construct child Post containers based on the list of children posts:
  // const childContainer$ = xs.combine(props$, deep$)
  //   .filter(([props, effect]) => effect.name === `${props.id}/children`)
  //   .map(([props, effect]) => effect)
  //   .filter(effect => effect.event === 'list.change')
  //   //Maintain a list of all instantiated sub Post containers:
  //   //deepstream always sends the full list (newList), so the job of
  //   //fold is just to remove old and add new containers over time (containers.)
  //   .fold((containers, newList) => {
  //     // Remove containers not found in newList:
  //     const newContainers = _.pick(containers, newList)
  //     // Add new containers from newlist
  //     _.forEach(_.difference(newList, Object.keys(containers)), (record) => {
  //       newContainers[record] = isolate(Post)(
  //         { ...sources, props$: xs.of({ id: record, expandChildren: 1 }) })
  //     })
  //     return newContainers
  //   }, {})

  const vdom$ = xs.of(h('div', 'hi for now'))

  return {
    DOM: vdom$,
    deep$: <Stream<DeepstreamRequest>>request$,
    history$: xs.never()
  }
}
