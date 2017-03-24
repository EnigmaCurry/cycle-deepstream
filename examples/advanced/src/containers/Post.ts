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

function view(postId, post: { title: string, content: string }, children, showReplyBox = false) {
  //Manually create a DOM element and corece it into a snabbdom VNode:
  const content = document.createElement('div.content')
  //Render post content from markdown to HTML:
  content.innerHTML = markdown.render(post.content ? post.content : '[no content]')
  return h('paper-card.post', { key: uuid4() }, [
    h(`div.card-content.post#post-${postId}`, [
      h('div.post-title', post.title ? post.title : '[no title]'),
      toVNode(content),
      h('ul.post-footer', [
        h('li', h(`paper-icon-button#star-${postId}`, { attrs: { icon: 'star' } })),
        h('li', h(`paper-icon-button#reply-${postId}`, { attrs: { icon: 'reply' } }))
      ]),
      h('div.replybox', { style: { display: showReplyBox ? 'block' : 'none' } }, [
        h('iron-autogrow-textarea.textbox', { attrs: { rows: 4, placeholder: 'Reply with your comment here' } }),
        h(`paper-button#send-${postId}.send`, { attrs: { raised: '' } }, "send"),
        h(`paper-button#cancel-${postId}.cancel`, { attrs: { raised: '' } }, "cancel")
      ]),
      h('div.post-children', { key: uuid4() }, children)
    ])
  ])
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
  const childPosts$ = Collection(Post, sources, childProps$, item => getChildRemoveStream(item.id$))

  const childPostsVdom$ = Collection.pluck(childPosts$, item => item.DOM)

  const showReplyBox$ = props$
    .map(props => props.id.replace(/\//g, '_'))
    .map(elemId => xs.merge(
      DOM.select(`#reply-${elemId}`).events('click').mapTo(true),
      DOM.select(`#cancel-${elemId}`).events('click').mapTo(false),
    ))
    .flatten()
    .debug('here')
    .startWith(false)

  const vdom$ = xs.combine(props$, post$, childPostsVdom$, showReplyBox$)
    .map(([props, post, childrenDOM, showReplyBox]) => view(props.id.replace(/\//g, '_'), post, childrenDOM, showReplyBox))

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
