import xs, { Stream } from 'xstream'
import { VNode, h, div, h1, br, img } from '@cycle/dom'
import * as navigation from '../actions/navigation'
import * as deepstream from '../actions/deepstream'

// NOTE: This page is pretty hacky, and is not pure functional. But it works.
// Mostly this is a workaround for bugs in Polymer + Cycle.js interaction.
// I could not get @polymer/app-layout/app-header-layout to render properly
// under snabbdom control, so this file mostly exists to replicate some of
// what that does. This has the following side effects:
// - Snabbdom hooks are used to directly open or close the app drawer
// - window level page resize event hooks are setup to reflow
//   the page for different device sizes.

//Polymer web components loaded with wc-loader:
const appLayout = require('../../bower_components/app-layout/app-layout.html')
const appEffects = require('../../bower_components/app-layout/app-scroll-effects/app-scroll-effects.html')

function adaptToPageWidth() {
  if (window.innerWidth > 640) {
    openDrawer(true)
  } else {
    closeDrawer()
  }
}

function openDrawer(persistent = false) {
  const header = <any>document.getElementById('app-header')
  const drawer = <any>document.getElementById('app-drawer')
  const scrollContainer = <any>document.getElementById('scroll-container')
  drawer.open()
  if (persistent) {
    drawer.setAttribute('persistent', '')
    header.style.left = '256px'
    scrollContainer.style.paddingLeft = '256px'
  }
}

function closeDrawer() {
  const header = <any>document.getElementById('app-header')
  const drawer = <any>document.getElementById('app-drawer')
  const scrollContainer = <any>document.getElementById('scroll-container')
  drawer.close()
  drawer.removeAttribute('persistent')
  header.style.left = '0px'
  scrollContainer.style.paddingLeft = '0px'
}

function view(subcontent: VNode): VNode {
  return div([
    h('app-drawer#app-drawer', {
      //attrs: { 'opened': '', persistent: '' },
      style: { zIndex: 200 }
    },
      [h('app-toolbar', 'Gettings Started')]),
    h('app-header#app-header', {
      style: {
        backgroundColor: '#00897B',
        color: '#fff',
        top: '0',
        left: '0px',
        right: '0',
        position: 'fixed'
      },
      attrs: { reveals: '', effects: 'waterfall' }
    },
      [
        h('app-toolbar', [
          h('div#app-menu-button', [
            h('img', {
              attrs: { src: 'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png' },
              style: { width: '40px', height: '40px' },
              hook: {
                // I couldn't get the 'on' handler to work, but insert hook does the same:
                insert: (vnode) => {
                  document.getElementById('app-menu-button').onclick = (ev) => openDrawer()
                }
              },
            })
          ]),
          div('#app-title', 'Beatle Chat')
        ])
      ]
    ),
    div('#scroll-container', { style: { paddingTop: '66px', paddingLeft: '0px' } }, [
      subcontent
    ])
  ])
}


export function Layout(sources: { DOM: Stream<VNode> }): { DOM: Stream<VNode> } {
  const { DOM } = sources

  // Non-functional side effect:
  // Open drawer automatically depending on device size:
  window.removeEventListener('resize', adaptToPageWidth)
  window.addEventListener('resize', adaptToPageWidth)

  const vdom$ = DOM
    .map(childDom => view(childDom))

  return {
    DOM: vdom$
  }
}
