import xs from 'xstream'
import { Sources, Sinks } from '../types'
import * as navigation from '../actions/navigation'
import * as deepstream from '../actions/deepstream'
import { div, h1, br, img } from '@cycle/dom'

const john = require('file-loader!../../images/john.jpg')
const paul = require('file-loader!../../images/paul.jpg')
const george = require('file-loader!../../images/george.jpg')
const ringo = require('file-loader!../../images/ringo.jpg')

function view() {
  const width = 150
  const userImg = (name, url) =>
    img('.user', {
      attrs: {
        name: name,
        src: url,
        width: width
      },
      style: {
        padding: '10px'
      }
    })

  return div('.outer', { style: { width: "100%" } },
    div('.login', { style: { width: "50%", margin: "0 auto", textAlign: "center" } },
      [
        h1("Click your favorite Beatle to login:"),
        userImg('john', john),
        userImg('paul', paul),
        br(),
        userImg('george', george),
        userImg('ringo', ringo)
      ])
  )
}

export function Login(sources: Sources): Sinks {
  const { DOM, deep$, history$ } = sources

  const userClick$ = DOM
    .select('.user')
    .events('click')
    .map(ev => ev.target['name'])

  const login$ = userClick$
    .map(name => deepstream.login(name, name))

  const navigation$ = deep$
    .filter(effect => effect.event === 'login.success')
    .map(ev => navigation.push('/'))

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: login$
  }
}
