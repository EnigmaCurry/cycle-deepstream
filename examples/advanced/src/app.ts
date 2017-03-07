import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats';
import { run } from '@cycle/run'
import { makeDOMDriver, div } from '@cycle/dom'
import { captureClicks, makeHistoryDriver } from '@cycle/history'
import { ReplaceHistoryInput } from '@cycle/history'
import { Location } from 'history'
import { Login } from './containers/login'
import { Home } from './containers/home'
import { Sources, Sinks, Route } from './types'
import * as pathToRegexp from 'path-to-regexp'

// Import our deepstream driver from the parent project folder:
import { makeDeepstreamDriver } from '../../../index'

// Application URL route to component mapping:
const routes: Array<Route> = [
  { name: 'index', component: Home, pattern: '/', },
  { name: 'login', component: Login, pattern: '/login' }
]

// Application main function -
// Main routing to individual components based on the current URL.
function main(sources: Sources): Sinks {
  const { DOM, history$ } = sources

  // Stream of current URL path
  const path$ = history$
    .map((location: Location) => location.pathname)
    .compose(dropRepeats())

  // Create a container and output it's DOM stream
  // Filter the DOM stream so that it only shows for the correct URL pattern:
  const createRouteStream = (route: Route) => {
    const routePattern = pathToRegexp(route.pattern)
    return xs.combine(xs.of(route), path$, route.component(sources).DOM)
      .filter(([route, location, dom]) => routePattern.test(location))
  }

  // Construct the main page DOM from the defined routes:
  const vdom$ = xs.merge.apply(null, routes.map(
    route => createRouteStream(route)))
    .map(([route, location, dom]) => dom)

  return {
    DOM: vdom$,
  }
}

// Create our main Cycle drivers and run the main:
run(main, {
  DOM: makeDOMDriver(document.body),
  history$: captureClicks(makeHistoryDriver({
    basename: '/', //base URL of the app
    forceRefresh: false, //No refreshing between pages
  }))
})
