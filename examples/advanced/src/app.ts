import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats';
import { run } from '@cycle/run'
import { makeDOMDriver, div } from '@cycle/dom'
import { captureClicks, makeHistoryDriver } from '@cycle/history'
import isolate from '@cycle/isolate'
import { Location } from 'history'
import { Login } from './containers/login'
import { Home } from './containers/home'
import { Sources, Sinks, Route } from './types'
import * as makePathRegex from 'path-to-regexp'

// Import our deepstream driver from the parent project folder:
import { makeDeepstreamDriver } from '../../../index'

// Application URL route to component mapping:
const routes: Array<Route> = [
  { container: Home, pattern: '/' },
  { container: Login, pattern: '/login' }
]

// Application main function -
// Main routing to individual components based on the current URL.
function main(sources: Sources): Sinks {
  const { DOM, history$ } = sources

  // Stream of current URL path
  const path$ = history$
    .map((location: Location) => location.pathname)

  // Create a map of route pattern to instantiated container object -
  // Create each container, but don't hook up any of their sinks yet:
  const containers = routes
    .reduce((acc, route) => (
      { ...acc, [route.pattern]: isolate(route.container)(sources) }
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

  // Create merged history stream from all the containers:
  const containerHistories = Object.keys(containers)
    .map(pattern => containers[pattern].history$)
  const navigation$ = xs.merge.apply(null, containerHistories)
    .debug(console.log)

  //Create the main DOM stream as the combined stream of all container
  //route streams. If the route changes, the whole dom is swapped.
  const routeStreams = routes.map(route => createRouteDOMStream(route))
  const vdom$ = xs.merge.apply(null, routeStreams)
    .map(([route, location, dom]) => dom)

  return {
    DOM: vdom$,
    history$: navigation$
  }
}

// Create our main Cycle drivers and run the main:
run(main, {
  DOM: makeDOMDriver(document.body),
  history$: captureClicks(makeHistoryDriver())
})
