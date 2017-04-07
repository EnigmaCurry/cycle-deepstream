import xs, { Stream } from 'xstream'
import delay from 'xstream/extra/delay'
import * as deepstream from 'deepstream.io-client-js'
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
      next: i => {
        //console.warn('Consumed stream value:', i)
        values.push(i)
      },
      complete: () => resolve(values),
      error: err => reject(err)
    })
  })
}

const expectStreamValues = (stream: Stream<any>, expected: Array<any>, next?: MochaDone) => {
  consumeStream(stream).then(values => {
    //console.log('Completed stream values:', values)
    expect(values).to.deep.equal(expected)
    if (next !== undefined) {
      next()
    }
  }).catch(err => {
    if (next !== undefined) {
      next(err)
    } else {
      throw new Error(err)
    }
  })
}

const safelyCloseDeepstream = (client: deepstreamIO.Client, callback?: Function) => {
  // Deepstream client has known issues with close() - there are
  // currently no guarantees that actions requested before close will
  // actually occur. We can get around this by adding a record get
  // call before close, as client requests are done sequentially, and
  // will allow the previous call to finish before we call close.
  client.record.getRecord('safelyCloseDeepstream').whenReady((record: deepstreamIO.Record) => {
    record.set({ stuff: client.getUid() }, err => {
      client.close()
      if (callback !== undefined) {
        callback()
      }
    })
  })
}

describe('cycle-deepstream', () => {
  let server: any, driver: CycleDeepstream, url: string

  before('start deepstream server', (next) => {
    portastic.find({ min: 6020, max: 6030 }).then((ports: Array<number>) => {
      url = `localhost:${ports[0]}`
      server = new Deepstream({ port: ports[0] })
      server.on('started', () => {
        expect(server.isRunning()).to.be.true
        driver = makeDeepstreamDriver(
          { url, options: { maxReconnectAttempts: 0 }, debug: true })
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

  it('record.subscribe receives events', next => {
    const action$ = xs.of(actions.record.subscribe('record1'))
    const event$ = driver(action$).take(3)
    const expected: Array<any> = [
      // Initial change event that fires automatically on subscribe
      { event: 'record.change', name: 'record1', data: { foo: 'bar' } },
      // Client set data event:
      { event: 'record.change', name: 'record1', data: { foo: 'bar2' } },
      // Client delete record event:
      { event: 'record.delete', name: 'record1' }
    ]
    const actual: Array<any> = []
    event$.addListener({
      next: (evt) => {
        console.log('EVENT ----- ', evt)
        actual.push(evt)
        if (actual.length === expected.length) {
          expect(actual).to.deep.equal(expected)
          next()
        }
      }
    })
    // Once we are subscribed, login with another client and
    // manipulate the record to trigger events:
    event$.take(1).addListener({
      complete: () => {
        const client = deepstream(url).login()
        client.record.getRecord('record1').whenReady((record: deepstreamIO.Record) => {
          record.set('foo', 'bar2', err => {
            record.delete()
          })
        })
      }
    })
  })
})
