// Adapted from https://github.com/garrydzeng/cycle-page

// MIT License

// Copyright (c) 2016 Garry

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


import xstream from "xstream"
import { adapt } from '@cycle/run/lib/adapt'
import * as domEvents from "dom-events"
import { supportsHistory } from "history/lib/DOMUtils"
import { useQueries, createHashHistory, createHistory, useBasename } from "history"
import { createPath } from "history/lib/PathUtils"
import * as qs from "querystring"
import * as pathToRegexp from "path-to-regexp"

export interface Location {
  host: string,
  protocol: string,
  path: string,
  canonicalPath: string,
  hash: string,
  baseName: string,
  state: any,
  queryString: string
}

export interface Page {
  name: string,
  args: any,
  location: Location
}

interface Options {
  hash?: boolean,
  baseName?: string,
  click?: boolean,
  patterns?: any
}

const PageAction = {
  push: "PUSH",
  replace: "REPLACE",
  forward: "FORWARD",
  back: "BACK"
}

const click = window.document && window.document.ontouchstart ? "touchstart" : "click"
const enabledHistory = supportsHistory()

function noop() { }

function removeBaseName(baseName: string, path: string) {
  return path.indexOf(baseName) === 0 ? path.substring(baseName.length) : path
}

function origin() {
  let location = window.location, result = location.protocol + "//" + location.hostname
  return location.port ?
    result + ":" + location.port :
    result
    ;
}

function isSameOrigin(url: string) {
  return url && url.indexOf(origin()) === 0
}

function which(event) {
  return event.which === null ? event.button : event.which
}

function build(pathname: string, queryString: string, hash: string = undefined) {
  return createPath({
    search: "?" + qs.stringify(queryString),
    pathname: pathname,
    hash: hash
  })
}

function makePageDriver(options: Options = {}) {

  const hash = options.hash || false
  const baseName = options.baseName || undefined
  const click = options.click || true
  const patterns = options.patterns || {}

  // history
  const buildHistory = useQueries(enabledHistory && !hash ? createHistory : createHashHistory)
  const history = typeof baseName == "undefined" ?
    buildHistory() :
    useBasename(buildHistory)({
      basename: baseName
    })

  function next(directive) {
    const action = directive.action
    switch (action) {

      /** Bellow action does not neeed location information... */
      case PageAction.back:
      case PageAction.forward: {
        action == PageAction.forward ? history.goForward() : history.goBack()
        break
      }

      case PageAction.push:
      case PageAction.replace: {

        // foreign domain
        const {host, protocol, path, queryString, state, hash} = directive.location
        if (host) {
          let url = (protocol || "http") + "://" + host, location = window.location
          if (!isSameOrigin(url)) {
            url += build(path, queryString, hash)
            action == PageAction.push ? location.href = url : location.replace(url)
            break
          }
        }

        const callback = action == PageAction.push ? history.push : history.replace
        callback({
          hash: hash,
          query: queryString,
          pathname: path,
          state: state
        })

        break
      }

      default: throw new TypeError(
        'Expected action enumeration, but got "' + typeof action + '"'
      )
    }
  }

  function handleClick(event) {

    if (which(event) !== 1) return
    if (event.metaKey || event.ctrlKey || event.shiftKey) return
    if (event.defaultPrevented) return

    let node = event.target
    while (node && node.nodeName !== 'A') {
      node = node.parentNode
    }

    if (node == null) return
    if (node.nodeName !== 'A') return
    if (node.getAttribute("rel") === "external") return
    if (node.hasAttribute("download")) return
    if (node.target) return
    if (!isSameOrigin(node.href)) return

    event.preventDefault()
    history.push(node.pathname + node.search + node.hash)
  }

  function match(location, routes) {

    const orginal = window.location
    const {query, pathname, state, hash} = location
    const context = (<Page>{
      args: {},
      location: (<Location>{
        host: orginal.host,
        protocol: orginal.protocol,
        path: pathname,
        canonicalPath: removeBaseName(baseName, pathname),
        hash: hash,
        baseName: baseName,
        state: state,
        queryString: query
      })
    })

    for (let id in routes) {
      const keys = [], regex = pathToRegexp(routes[id], keys), matches = regex.exec(pathname)
      if (matches) {
        keys.forEach(key => context.args[key.name] = matches[1])
        context['name'] = id
        break
      }
    }

    return context
  }

  return function PageDriver(directive$) {

    click && domEvents.on(window.document, "click", handleClick)

    // listen to stream if user provided...
    if (directive$) {
      directive$.addListener({
        next: next,
        complete: noop,
        error: noop
      })
    }

    let unsubscrbe

    const page$ = xstream.create({
      start: function startPageStream(listener) {

        // hack??
        unsubscrbe = history.listen(location => {
          location.action == "PUSH" && listener.next(match(location, patterns))
        })

        // if user not provided initial directive, we emit current location alternative.
        if (!directive$) {
          listener.next(match(
            history.getCurrentLocation(),
            patterns
          ))
        }
      },
      stop: function stopPageStream() {
        click && domEvents.off(window.document, "click", handleClick)
        unsubscrbe()
      }
    })

    return adapt(page$)
  }
}

export {
  makePageDriver,
  PageAction
}
