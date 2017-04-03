import xs, { Stream } from 'xstream'
import { expect } from 'chai'
import { makeDeepstreamDriver, CycleDeepstream, Intent, Event } from './index'
import * as actions from './actions'
import { mockTimeSource } from '@cycle/time'

const Deepstream = require('deepstream.io')
const portastic = require('portastic')

describe('cycle-deepstream', () => {
  let server: any, port: number

  beforeEach('start deepstream test server', (next: Function) => {
    portastic.find({ min: 6020, max: 6030 }).then((ports: Array<number>) => {
      port = ports[0]
      server = new Deepstream({ port })
      server.on('started', () => {
        expect(server.isRunning()).to.be.true
        next()
      })
      server.start()
    })
  })

  afterEach('stop deepstream server', next => {
    server.on('stopped', () => {
      next()
    })
    server.stop()
  })

  it('must login', next => {
    const Time = mockTimeSource()
    const driver = makeDeepstreamDriver(
      { url: `localhost:${port}`, debug: true })

    const action$ = Time.diagram('x|', { x: actions.login() })
    const result$ = driver(action$).take(1)
    const expected$ = Time.diagram('e|', { e: { event: 'login.success' } })
    result$.addListener({
      complete: () => {
        Time.assertEqual(result$, expected$)
        next()
      }
    })
    Time.run()
  })
})
