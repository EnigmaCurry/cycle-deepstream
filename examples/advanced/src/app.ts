import xs from 'xstream'
import { run } from '@cycle/run'
import { makeDOMDriver } from '@cycle/dom'
import { makePageDriver, PageAction, Page } from './drivers/router'
import { Login } from './containers/login'
import { Home } from './containers/home'
import { Route } from './interfaces'

// Import our deepstream driver from the parent project folder:
import { makeDeepstreamDriver } from '../../../index'

// Application URL route to component mapping:
const routes: Array<Route> = [
  { name: 'index', component: Home, pattern: '/', },
  { name: 'login', component: Login, pattern: '/login' }
]

// Application main function -
// Main routing to individual components based on the current URL.
function main(sources) {
  const { DOM, page } = sources

  // Create a container and output it's DOM stream
  // Filter the DOM stream so that it only shows for the correct URL pattern:
  const createRouteStream = (route: string, container) => {
    return xs.combine(page, container(sources).DOM)
      // Container DOM is only emitted when on the correct page:
      .filter(([context, dom]) => (<Page>context).name === route)
      .map(([context, dom]) => dom)
  }

  // Construct the main page DOM from the defined routes:
  const vdom$ = xs.merge.apply(null, routes.map(
    route => createRouteStream(route.name, route.component)))

  return {
    DOM: vdom$,
    page: xs.of({
      action: PageAction.push,
      location: {
        path: window.location.pathname
      }
    })
  }
}

// Create our main Cycle drivers and run the main:
run(main, {
  DOM: makeDOMDriver(document.body),
  page: makePageDriver({
    // Creates pattern mapping from routes definition:
    // eg: [{name:'index', pattern} -> {index:'/', login:'/login', ...}
    patterns: routes.reduce(
      (patterns, route) => (
        { ...patterns, [route.name]: route.pattern }
      ), {})
  })
})
