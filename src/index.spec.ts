import xs, { Stream } from 'xstream'
import { expect } from 'chai'
import { makeDeepstreamDriver, CycleDeepstream, Intent, Event } from './index'
import * as actions from './actions'
import { mockTimeSource, MockTimeSource } from '@cycle/time'

const Deepstream = require('deepstream.io')
const portastic = require('portastic')

const waitForStream = (stream: Stream<any>) => {
  return new Promise((resolve, reject) => {
    stream.addListener({ complete: () => resolve(), error: (err) => reject(err) })
  })
}

describe('cycle-deepstream', () => {
  let server: any, driver: CycleDeepstream

  before('start deepstream server', (next) => {
    portastic.find({ min: 6020, max: 6030 }).then((ports: Array<number>) => {
      server = new Deepstream({ port: ports[0] })
      server.on('started', () => {
        expect(server.isRunning()).to.be.true
        driver = makeDeepstreamDriver(
          { url: `localhost:${ports[0]}`, options: { maxReconnectAttempts: 0 }, debug: true })
        next()
      })
      server.start()
    })
  })

  it('must login', next => {
    const time = mockTimeSource()
    const login$ = time.diagram('x|', { x: actions.login() })
    const loginResponse$ = driver(login$)
      .filter(evt => evt.event === 'login.success')
      .take(1)
    const loginExpected$ = time.diagram('e|', { e: { event: 'login.success' } })
    waitForStream(loginResponse$).then(() => {
      time.assertEqual(loginResponse$, loginExpected$)
      next()
    })
    time.run()
  })

  it('must logout', next => {
    const time = mockTimeSource()
    const logout$ = time.diagram('x|', { x: actions.logout() })
    const logoutResponse$ = driver(logout$)
      .filter(evt => evt.event === 'logout')
      .take(1)
    const logoutExpected$ = time.diagram('e|', { e: { event: 'logout' } })
    waitForStream(logoutResponse$).then(() => {
      time.assertEqual(logoutResponse$, logoutExpected$)
      next()
    })
    time.run()
  })

})
