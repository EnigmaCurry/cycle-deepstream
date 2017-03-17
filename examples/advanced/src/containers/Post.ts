import xs, { Stream } from 'xstream'
import * as ds from '../actions/deepstream'
import { VNode, h } from '@cycle/dom'
import isolate from '@cycle/isolate'
import Collection from '@cycle/collection'
import { Sources, Sinks, DeepstreamRequest } from '../types'
import * as Markdown from 'markdown-it'
import { toVNode } from 'snabbdom/tovnode'
import * as uuid4 from 'uuid/v4'
import _ from 'lodash'

const markdown = new Markdown()

function view(post: { content: string }, children) {
  //Render post content from markdown to HTML.
  const content = markdown.render(post.content ? post.content : 'Nothing here')
  //Manually create a DOM element and corece it into a snabbdom VNode:
  const elm = document.createElement('div.content')
  elm.innerHTML = content
  return h('div.post', { key: uuid4() }, [toVNode(elm), h('div.children', { key: uuid4() }, children)])
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
  const { deep$, props$ } = sources

  // Deepstream requests to load the post data:
  const postRequest$ = xs.merge(
    // Request the post specified in props.id
    props$.map(({ id }) => ds.record.subscribe(id)),
    // Request the list of children posts:
    // We pass list.change=false to omit redundant data that is also
    // in the list.entry-* events (change events is the WHOLE list
    // every time, whereas the entry-* events are for individual
    // elements in the list. You could code it either way, but we'll
    // use the individual events.)
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

  const children$ = xs.combine(props$, deep$)
    .filter(([props, effect]) => effect.name === `${props.id}/children`)
    .map(([props, effect]) => effect)

  // Create stream of props for new child posts added:
  const childProps$ = children$
    .filter(effect => effect.event === 'list.entry-existing' ||
      effect.event === 'list.entry-added')
    .map(effect => ({ props$: xs.of({ id: effect.entry, expandChildren: 1 }) }))

  // Create stream of remove events for a particular child post:
  const getChildRemoveStream = (recordName$) => xs.combine(children$, recordName$)
    .filter(([effect, recordName]) => effect.event === 'list.entry-removed')
    .filter(([effect, recordName]) => effect.name === recordName)
    .mapTo('remove me')

  // The list of all children post containers, composed as a fractal tree of Posts.
  const childPosts$ = Collection(Post, { deep$ }, childProps$, item => getChildRemoveStream(item.id$))

  const childPostsVdom$ = Collection.pluck(childPosts$, item => item.DOM)

  const vdom$ = xs.combine(post$, childPostsVdom$)
    .map(([post, childrenDOM]) => view(post, childrenDOM))

  const childRequest$ = childPosts$
    .map(postList => xs.merge.apply(null, postList.map(post => post.deep$)))
    .flatten()

  const request$ = xs.merge(postRequest$, childRequest$)

  return <Sinks>{
    DOM: vdom$,
    deep$: request$,
    history$: xs.never(),
    id$: props$.map(props => props.id)
  }
}
