import xs from 'xstream'
import {run} from '@cycle/run'
import { div, span, h1, hr, br, a, input, makeDOMDriver } from '@cycle/dom'
import {makeDeepstreamDriver} from '../index'

function main(sources) {

  // Request stream is intents for deepstream driver to handle:
  const request$ = xs.merge(
    // Subscribe to the deepstream record named 'test':
    xs.of({ action: 'record.subscribe', name: 'test' }),
    // Update the record whenever the user enter's their name:
    sources.DOM.select('#username')
      .events('input')
      .map(ev => ev.target.value)
      .map(username => ({ action: 'record.set', name: 'test', path: 'name', data: username}))
  )
  
  // Update the dom whenever a change to the 'test' record comes back:
  const deep$ = sources.DEEP
  const vdom$ = deep$
        .filter(effect => effect.event === 'record.change')
        .filter(effect => effect.name === 'test')
        .map(effect => effect.data)
        .map(data => div([
          span("Name: "),
          input({attrs: {id:'username', placeholder: 'Enter your name', autocomplete:'off'}}),
          hr(),
          h1(data.name === undefined ? '' : `Hello, ${data.name}`),
          br(),
          div([
            span('Hint: open '),
            a({attrs: {href:'#', target:'_blank'}}, 'this page in multiple windows'),
            span(' to see changes sync between browsers.')
          ])
        ]))
  
  return {
    DOM: vdom$,
    DEEP: request$
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
  DEEP: makeDeepstreamDriver('localhost:6020')
})
