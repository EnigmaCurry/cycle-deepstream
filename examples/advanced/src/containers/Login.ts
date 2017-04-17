import xs from 'xstream'
import { Sources, Sinks } from '../types'
import * as navigation from '../actions/navigation'
import * as ds from '../actions/deepstream'
import { div, h1, br, img } from '@cycle/dom'
import { Location } from 'history'
import { userImages } from '../images'

function view() {
  const width = 150
  const userImg = (name, url) =>
    div('.user', {
      attrs: {
        name: name,
      },
      style: {
        display: 'inline-block',
        padding: '10px',
        width: '100px',
        height: '100px',
        background: `url(${url}) no-repeat center`,
        backgroundSize: '100px 100px'
      }
    })

  return div('.outer', { style: { width: "100%" } },
    div('.login', { style: { width: "100%", margin: "0 auto", textAlign: "center" } },
      [
        h1("Click your favorite Beatle to sign in:"),
        userImg('john', userImages.john),
        userImg('paul', userImages.paul),
        br(),
        userImg('george', userImages.george),
        userImg('ringo', userImages.ringo)
      ])
  )
}

export function Login(sources: Sources): Sinks {
  const { DOM, deep$, history$ } = sources

  const userClick$ = DOM
    .select('.user')
    .events('click')
    .map(ev => (<HTMLElement>ev.target).getAttribute('name'))

  const login$ = userClick$
    .map(name => ds.login({ username: name, password: name }))

  const navigation$ = deep$
    .filter(effect => effect.event === 'login.success')
    //TODO: Go back to referer. goBack() doesn't quite work, lets be explicit.
    .map(ev => navigation.push('/'))

  const vdom$ = xs.of(view())

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: login$
  }
}
