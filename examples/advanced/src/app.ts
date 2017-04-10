// app.ts
// The main entry point for this example application.
//  - It's job is to create containers for different routes,
//    pass them sources, and hook up their sinks.
//  - main() is our main entry point
//  - run() invokes Cycle.js on our main function.
//  - Pages of our app are contained in seperate components
//    found in the containers/ subdirectory.
//  - Each container component is isolated from each other
//    with @cycle/isolate. (Actions bound to HTML tag class names
//    won't leak to other components with the same class names.)
//  - Each container follows the Sources => Sinks interface
//    defined in types.ts, including DOM, history$, etc.
//  - URLs are mapped to these component containers with patterns
//    specified in the routes array.

import xs, { Stream } from 'xstream'
import { run } from '@cycle/run'
import { makeDOMDriver, h } from '@cycle/dom'
import { makeTitleDriver } from './drivers/title'
import { captureClicks, makeHistoryDriver, HistoryInput } from '@cycle/history'
import isolate from '@cycle/isolate'
import { Location } from 'history'
import { Login, Home, AppDrawer } from './containers'
import { MainSources, Sources, Sinks, MainSinks, Route } from './types'
import * as navigation from './actions/navigation'
import * as makePathRegex from 'path-to-regexp'
import '../styles/app.scss'

// Import our deepstream driver from the parent project folder:
import { makeDeepstreamDriver } from '../../../src/index'

// Import the main web component for our app via wc-loader:
require('../x-app.html')

export const appTitle = 'Beatle Chat'

// Application URL route to component mapping:
const routes: Array<Route> = [
  { container: Home, pattern: '/', title: 'Home' },
  { container: Login, pattern: '/login', title: 'Login' }
]

// Application main function -
// Main routing to individual components based on the current URL.
function main(sources: MainSources): MainSinks {
  // Receive Source streams from our cycle drivers:
  const { DOM, history$, deep$, drawer$ } = sources

  // Stream that observes the current URL path
  const path$ = history$
    .map((location: Location) => location.pathname)

  // Logged in user state:
  const user$ = xs.merge(
    // null when the user is logged out.
    // userData object when logged in (deepstream clientData from users.yml.)
    deep$
      .filter(effect => effect.event === 'logout' ||
        effect.event === 'login.failure')
      .mapTo(null),
    deep$
      .filter(effect => effect.event === 'login.success')
      .map(effect => effect.data))
    .startWith(null)
    .remember()

  // On deepstream logout, return to the login page:
  const logout$ = user$
    .filter(userData => userData === null)
    .map(effect => navigation.replace("/login"))

  // Create each container and map it to it's route pattern - 
  // Don't hook up any of the sinks yet:
  const containers: { [pattern: string]: Sinks } = routes
    .reduce((acc, route) => (
      { ...acc, [route.pattern]: isolate(route.container)({ ...sources, user$ }) }
    ), {})

  // A Route DOM stream is a combined stream of the following:
  //  - The configured Route object (static)
  //  - The current browser Location from the path$
  //  - The most recent DOM update from the container
  // This stream is filtered to only emit when the Location matches the Route.
  const createRouteDOMStream = (route: Route) => {
    const routeRegex = makePathRegex(route.pattern)
    const container = containers[route.pattern]
    return xs.combine(xs.of(route), path$, container.DOM)
      .filter(([route, location, dom]) => routeRegex.test(location))
  }

  // Merge common sink types together into one stream:
  const createMergedSinks = (sink: string): Stream<any> => {
    const containerStreams = Object.keys(containers)
      .map(pattern => containers[pattern][sink])
    return xs.merge.apply(null, containerStreams)
  }

  //Create the main DOM stream as the combined stream of all container
  //route streams. If the route changes, the whole dom is swapped.
  const routeStreams = xs.merge.apply(
    null, routes.map(route => createRouteDOMStream(route)))
  const routeDOM$ = routeStreams
    .map(([route, location, dom]) => dom)

  // Page title:
  const title$ = routeStreams
    .map(([route, location, dom]) => `${route.title}`)

  // Side bar drawer content:
  const appDrawer = isolate(AppDrawer)({ sources, deep$, DOM: drawer$ })
  // App header bar content:
  const appHeaderDOM$ = title$
    .map(title => h('div', h('div', { attrs: { mainTitle: '' } }, title)))

  // Return our (merged and combined) Sinks back to our cycle drivers:
  return {
    DOM: routeDOM$,
    drawer$: appDrawer.DOM,
    header$: appHeaderDOM$,
    title$: title$,
    history$: xs.merge(createMergedSinks('history$'), logout$),
    deep$: xs.merge(appDrawer.deep$, createMergedSinks('deep$'))
  }
}

// Create our main Cycle drivers and run the main:
run(main, {
  // @cycle/dom drivers -
  // Normally, a cycle.js app has one DOM driver.
  // We split this into a few seperate ones: DOM, header$, drawer$
  //  - DOM is for the main scrollable area of the page
  //  - header$ is for the application header area
  //  - drawer$ is for the slideout drawer area
  // We do this because we are using the app-layout web component from
  // Polymer. Its idiosyncrasies require setting up it's DOM first,
  // before cycle/snabbdom runs, and then we attach to the three divs
  // created in ../x-app.html. 
  DOM: makeDOMDriver('#app-content'),
  header$: makeDOMDriver('#app-header'),
  drawer$: makeDOMDriver('#app-drawer'),
  // title driver:
  title$: makeTitleDriver(document.querySelector('title'), `${appTitle} - `),
  // @cycle/history driver
  history$: captureClicks(makeHistoryDriver()),
  // cycle-deepstream driver
  // TODO: Fix the type here, without 'any' it gives me 'Two different types with
  // this name exist, but they are unrelated.' errors
  deep$: <any>makeDeepstreamDriver({ url: `${window.location.hostname}:6020`, debug: true })
})
