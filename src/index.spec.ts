import xs, { Stream } from 'xstream'
import * as chai from 'chai'
import { makeDeepstreamDriver, CycleDeepstream, Intent, Event } from './index'
import * as actions from './actions'

const expect = chai.expect
const Deepstream = require('deepstream.io')
const portastic = require('portastic')

const consumeStream = (stream: Stream<any>): Promise<Array<any>> => {
  const values: Array<any> = []
  return new Promise((resolve, reject) => {
    stream.addListener({
      next: i => values.push(i),
      complete: () => resolve(values),
      error: err => reject(err)
    })
  })
}

const expectStreamValues = (stream: Stream<any>, expected: Array<any>, next: MochaDone) => {
  consumeStream(stream).then(values => {
    expect(values).to.deep.equal(expected)
    next()
  }).catch(err => next(err))
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
    const action$ = xs.of(actions.login())
    const actual$ = driver(action$).filter(evt => evt.event === 'login.success').take(1)
    const expected: any = [{ event: 'login.success', data: null }]
    expectStreamValues(actual$, expected, next)
  })

  it('sets record', next => {
    const action$ = xs.of(actions.record.set('record1', { foo: 'bar' }))
    const actual$ = driver(action$)
    next()
  })

  it('record.get retrieves a record', next => {
    const action$ = xs.of(actions.record.get('record1'))
    const actual$ = driver(action$).take(1)
    const expected = [{ event: 'record.get', name: 'record1', data: { foo: 'bar' } }]
    expectStreamValues(actual$, expected, next)
  })

  it('record.snapshot retreives a record snapshot', next => {
    const action$ = xs.of(actions.record.snapshot('record1'))
    const actual$ = driver(action$).take(1)
    const expected = [{ event: 'record.snapshot', name: 'record1', data: { foo: 'bar' } }]
    expectStreamValues(actual$, expected, next)
  })

})
