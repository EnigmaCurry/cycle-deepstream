import xs from 'xstream'
import { h, div, br, span, a, button, input } from '@cycle/dom'
import * as deepstream from '../actions/deepstream'
import { Sources, Sinks } from '../types'

import './AppDrawer.scss'

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

  const appDrawerLayout = (<any>document.querySelector('app-drawer-layout'))
  if (userData) {
    // SIDE EFFECT: Turn off forceNarrow mode:
    appDrawerLayout.forceNarrow = false
    return div('.app-drawer-content', [
      div('.center', [
        h('h1', `Hey ${userData.name}`),
        h('img.avatar', { attrs: { src: userImages[userData.userid] } }),
        h('br'),
        h('paper-button#drawer-sign-in.sign-in.button.green', {
          attrs: { raised: '' },
          hook: hooks
        }, 'sign out')
      ])
    ])
  } else {
    // SIDE EFFECT: Force app to narrow mode if we aren't logged in.
    // This effectively hides the redundant login message.
    appDrawerLayout.forceNarrow = true
    return div('.app-drawer-content', [
      div('.center', [
        h('h1', "Don't you like the Beatles?"),
        h('paper-button#drawer-sign-in.sign-in.button.green', {
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
