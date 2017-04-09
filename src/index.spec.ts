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

const expectStreamValues = (stream: Stream<any>, expected: Array<any>) => {
  return new Promise((resolve, reject) => {
    consumeStream(stream).then(values => {
      //console.log('Completed stream values:', values)
      expect(values).to.deep.equal(expected)
      resolve()
    }).catch(err => reject(err))
  })
}

describe('cycle-deepstream', () => {
  let server: any, url: string, client: deepstreamIO.Client
  // action$ is requests to deepstream - shamefully sent next elements through the tests
  // deep$ is events coming from deepstream
  const action$ = xs.never()
  let deep$: Stream<Event>

  before('start deepstream server', (next) => {
    portastic.find({ min: 6020, max: 6030 }).then((ports: Array<number>) => {
      url = `localhost:${ports[0]}`
      server = new Deepstream({ port: ports[0] })
      server.on('started', () => {
        expect(server.isRunning()).to.be.true
        deep$ = makeDeepstreamDriver(
          { url, options: { maxReconnectAttempts: 0 }, debug: true })(action$)
        client = deepstream(url).login()
        next()
      })
      server.start()
    })
  })

  it('must login to deepstream', next => {
    const login$ = deep$
      .filter(evt => evt.event === 'login.success')
      .take(1)
    expectStreamValues(login$, [{ event: 'login.success', data: null }])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.login())
  })

  it('must subscribe to records', next => {
    const subscribe$ = deep$
      .filter(evt => evt.event === 'record.change')
      .take(6)
    expectStreamValues(subscribe$, [
      { event: 'record.change', name: 'recordToModify', data: {} },
      { event: 'record.change', name: 'recordToDiscard', data: {} },
      { event: 'record.change', name: 'recordToDelete', data: {} },
      { event: 'record.change', name: 'listitem1', data: {} },
      { event: 'record.change', name: 'listitem2', data: {} },
      { event: 'record.change', name: 'listitem3', data: {} }
    ])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.record.subscribe('recordToModify'))
    action$
      .shamefullySendNext(actions.record.subscribe('recordToDiscard'))
    action$
      .shamefullySendNext(actions.record.subscribe('recordToDelete'))
    action$
      .shamefullySendNext(actions.record.subscribe('listitem1'))
    action$
      .shamefullySendNext(actions.record.subscribe('listitem2'))
    action$
      .shamefullySendNext(actions.record.subscribe('listitem3'))
  })

  it('must respond to changing records', next => {
    const recordChange$ = deep$
      .filter(evt => evt.event === 'record.change')
      .take(3)
    expectStreamValues(recordChange$, [
      { event: 'record.change', name: 'recordToModify', data: { foo: 'bar' } },
      { event: 'record.change', name: 'recordToModify', data: { foo: 'bar', thing: 'fling' } },
      { event: 'record.change', name: 'recordToModify', data: { foo: 'bar', thing: 3 } },
    ]).then(next)
      .catch(next)
    //Modify the record to fire record.change:
    client.record.getRecord('recordToModify').whenReady((record: deepstreamIO.Record) => {
      record.set({ foo: 'bar' })
      record.set('thing', 'fling')
      record.set('thing', 3)
    })
  })

  it('must set records with record.set', next => {
    const recordSet$ = deep$
      .filter(evt => evt.event === 'record.set')
      .take(2)
    expectStreamValues(recordSet$, [
      // Four set actions are performed, only two have write acknowledgement:
      { event: 'record.set', name: 'recordToModify' },
      { event: 'record.set', name: 'recordToModify' }
    ]).then(next)
      .catch(next)
    //Set without write acknowledgement
    action$.shamefullySendNext(actions.record.set('recordToModify', { foo: 'somethingelse' }))
    //Set with write acknowledgement
    action$.shamefullySendNext(actions.record.set('recordToModify', { foo: 'bar2' }, true))
    //Set with path without write acknowledgement
    action$.shamefullySendNext(actions.record.setPath('recordToModify', 'foo', 'somethingelse2'))
    //Set with path and write acknowledgement
    action$.shamefullySendNext(actions.record.setPath('recordToModify', 'foo', 'bar', true))
  })

  it('must retrieve records with record.get', next => {
    const recordGet$ = deep$
      .filter(evt => evt.event === 'record.get')
      .take(1)
    expectStreamValues(recordGet$, [{ event: 'record.get', name: 'recordToModify', data: { foo: 'bar' } }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.record.get('recordToModify'))
  })

  it('must retrieve records with record.snapshot', next => {
    const recordSnapshot$ = deep$
      .filter(evt => evt.event === 'record.snapshot')
      .take(1)
    expectStreamValues(recordSnapshot$, [{ event: 'record.snapshot', name: 'recordToModify', data: { foo: 'bar' } }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.record.snapshot('recordToModify'))
  })

  it('must respond to discarding records', next => {
    const recordDiscard$ = deep$
      .filter(evt => evt.event === 'record.discard')
      .take(1)
    expectStreamValues(recordDiscard$, [{ event: 'record.discard', name: 'recordToDiscard' }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.record.discard('recordToDiscard'))
  })

  it('must respond to deleting records', next => {
    const recordDelete$ = deep$
      .filter(evt => evt.event === 'record.delete')
      .take(1)
    expectStreamValues(recordDelete$, [{ event: 'record.delete', name: 'recordToDelete' }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.record.delete('recordToDelete'))
  })

  it('must respond to record listening', next => {
    const recordListen$ = deep$
      .filter(evt => evt.event === 'record.listen')
      .take(1)
    expectStreamValues(recordListen$, [{ event: 'record.listen', match: 'listen1', isSubscribed: true }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.record.listen('listen1'))
    // Get the record with the other client, to trigger the listen callback:
    client.record.getRecord('listen1')
  })

  it('must logout from deepstream', next => {
    const logout$ = deep$
      .filter(evt => evt.event === 'logout')
      .take(1)
    expectStreamValues(logout$, [{ event: 'logout' }])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.logout())
  })

  it('must support login again after logout', next => {
    const login$ = deep$
      .filter(evt => evt.event === 'login.success')
      .take(1)
    expectStreamValues(login$, [{ event: 'login.success', data: null }])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.login())
  })

  it('must subscribe to lists', next => {
    const subscribe$ = deep$
      .filter(evt => evt.event === 'list.change')
      .take(1)
    expectStreamValues(subscribe$, [{ event: 'list.change', name: 'list1', data: [] }])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.list.subscribe('list1'))
  })

  it('must respond to adding things to a list', next => {
    const expected = [
      { event: 'list.entry-added', name: 'list1', entry: 'listitem1', position: 0 },
      { event: 'list.entry-added', name: 'list1', entry: 'listitem2', position: 1 },
      { event: 'list.entry-added', name: 'list1', entry: 'listitem3', position: 2 },
      { event: 'list.entry-added', name: 'list1', entry: 'listitem4', position: 3 }]
    const listEntryAdded$ = deep$
      .filter(evt => evt.event === 'list.entry-added')
      .take(expected.length)

    expectStreamValues(listEntryAdded$, expected)
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.list.addEntry('list1', 'listitem1'))
    action$
      .shamefullySendNext(actions.list.addEntry('list1', 'listitem2'))
    action$
      .shamefullySendNext(actions.list.addEntry('list1', 'listitem3'))
    action$
      .shamefullySendNext(actions.list.addEntry('list1', 'listitem4'))
  })

  it('must respond to removing things in a list', next => {
    const listEntryRemoved$ = deep$
      .filter(evt => evt.event === 'list.entry-removed')
      .take(1)
    expectStreamValues(listEntryRemoved$, [
      { event: 'list.entry-removed', name: 'list1', entry: 'listitem1', position: 0 }
    ]).then(next)
      .catch(next)
    action$.shamefullySendNext(actions.list.removeEntry('list1', 'listitem1'))
  })

  it('must get list entries', next => {
    const listGetEntries$ = deep$
      .filter(evt => evt.event === 'list.getEntries')
      .take(1)
    expectStreamValues(listGetEntries$, [
      { event: 'list.getEntries', name: 'list1', data: ['listitem2', 'listitem3', 'listitem4'] }
    ]).then(next)
      .catch(next)
    action$.shamefullySendNext(actions.list.getEntries('list1'))
  })

  it('must set list entries', next => {
    const listSetEntries$ = deep$
      .filter(evt => evt.event === 'list.change')
      .take(1)
    expectStreamValues(listSetEntries$, [
      { event: 'list.change', name: 'list1', data: ['listitem1', 'listitem2'] }
    ]).then(next)
      .catch(next)
    action$.shamefullySendNext(actions.list.setEntries('list1', ['listitem1', 'listitem2']))
  })

  it('must get existing list entries on new subscribe', next => {
    const subscribe$ = deep$
      .filter(evt => evt.event === 'list.entry-existing')
      .take(2)
    expectStreamValues(subscribe$, [
      { event: 'list.entry-existing', name: 'list1', entry: 'listitem1', position: 0 },
      { event: 'list.entry-existing', name: 'list1', entry: 'listitem2', position: 1 }
    ])
      .then(next)
      .catch(next)
    action$
      .shamefullySendNext(actions.list.subscribe('list1'))
  })

  it('must respond to discarding lists', next => {
    const listDiscard$ = deep$
      .filter(evt => evt.event === 'list.discard')
      .take(1)
    expectStreamValues(listDiscard$, [{ event: 'list.discard', name: 'list1' }])
      .then(next)
      .catch(next)
    action$.shamefullySendNext(actions.list.discard('list1'))
  })

  it('must respond to deleting a list', next => {
    const subscribe$ = deep$
      .filter(evt => evt.event === 'list.entry-existing')
      .take(2)
    expectStreamValues(subscribe$, [
      { event: 'list.entry-existing', name: 'list1', entry: 'listitem1', position: 0 },
      { event: 'list.entry-existing', name: 'list1', entry: 'listitem2', position: 1 }
    ])
      .catch(next)
    const delete$ = deep$
      .filter(evt => evt.event === 'list.delete')
      .take(1)
    expectStreamValues(delete$, [{ event: 'list.delete', name: 'list1' }])
      .then(next)
      .catch(next)

    action$
      .shamefullySendNext(actions.list.subscribe('list1'))
    action$
      .shamefullySendNext(actions.list.delete('list1'))
  })


})
