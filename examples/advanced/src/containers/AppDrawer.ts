import xs from 'xstream'
import { h, div, br, span, a, button, input } from '@cycle/dom'
import * as deepstream from '../actions/deepstream'
import { Sources, Sinks } from '../types'

import '../../styles/AppDrawer.scss'

const userImages = {
  john: require('file-loader!../../images/john.jpg'),
  paul: require('file-loader!../../images/paul.jpg'),
  george: require('file-loader!../../images/george.jpg'),
  ringo: require('file-loader!../../images/ringo.jpg')
}

function view(userData = null) {
  const hooks = {
    // Close drawer hook:
    insert: (node) => {
      node.elm.addEventListener('click', (ev) => {
        const appDrawer = (<any>document.querySelector('app-drawer'))
        if (appDrawer.getAttribute('persistent') === null) {
          appDrawer.close()
        }
      })
    }
  }

  const randomGreeting = (name) => {
    const greetings = [
      `Ask me why, ${name}?`,
      `Love me do, ${name}.`,
      `Stop my mind from wandering, ${name}!`,
      `A four of fish and finger pies.`,
      `${name}, don't you know? We all live in a yellow submarine!`,
      `Where do they all belong, ${name}?`,
      `${name} got the bill and Rita paid it.`,
      `Do you want to know a secret, ${name}?`,
      `${name}, let it be, let it be.`,
      `Alright, alright, ${name}.`,
      `Don't let me down.`,
      `There will be a show tonight on trampoline.`,
      `Baby take a chance with me.`,
      `We'd like to thank you once again.`,
      `${name}? Oh, he just plays it like that.`,
      `Send me a postcard, ${name}, drop me a line.`,
      `Deliver the letter, sooner the better.`,
      `I'd like to be, under the sea.`,
      `All these places have their moments.`,
      `Just to dance with you is everything.`,
      `Tomorrow may rain, so follow the sun.`,
      `${name}, don't you know the latest dance?`,
      `It's the next best thing to be, ${name}, free as a bird.`,
      `${name}, feeling two foot small. You've got to hide your love away.`,
      `${name}, I read the news today, oh boy!`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  const appDrawerLayout = (<any>document.querySelector('app-drawer-layout'))
  if (userData) {
    // User logged in - profile text:
    // SIDE EFFECT: Turn off forceNarrow mode:
    appDrawerLayout.forceNarrow = false
    return div('.app-drawer-content', [
      div([
        h('h1.center', `Hey ${userData.name}`),
        div([
          h('img.avatar', { attrs: { src: userImages[userData.userid] } }),
          h('paper-button#drawer-sign-in.sign-in.button.profile', {
            attrs: { raised: '' },
            hook: hooks
          }, 'sign out'),
          h('paper-button#drawer-settings.button.profile', {
            attrs: { raised: '' },
            hook: hooks
          }, 'settings')]),
      ]),
      div('.center', [
        h('hr'),
        h('span', randomGreeting(userData.name)),
        h('hr'),
      ])
    ])
  } else {
    // Not logged in - Sign in text
    // SIDE EFFECT: Force app to narrow mode if we aren't logged in.
    // This effectively hides the redundant login message.
    appDrawerLayout.forceNarrow = true
    return div('.app-drawer-content', [
      div('.center', [
        h('h1', "Don't you like the Beatles?"),
        h('paper-button#drawer-sign-in.sign-in.button', {
          attrs: { raised: '' },
          hook: hooks
        }, 'sign in already')
      ])
    ])
  }
}

export function AppDrawer(sources: Sources): Sinks {
  const { DOM, history$, deep$ } = sources

  const loginState$ = xs.merge(
    deep$
      .filter(effect => effect.event === 'logout' || effect.event === 'login.failure')
      .mapTo(null),
    deep$
      .filter(effect => effect.event === 'login.success')
      .map(effect => effect.data))
    .startWith(null)

  const logoutAction$ = DOM
    .select('#drawer-sign-in')
    .events('click')
    .map(ev => deepstream.logout())

  const vdom$ = loginState$
    .map(userData => view(userData))

  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: logoutAction$
  }
}
