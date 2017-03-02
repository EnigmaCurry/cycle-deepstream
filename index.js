import xs from 'xstream'
import deepstream from 'deepstream.io-client-js'
import {EventEmitter} from 'events'

export function makeDeepstreamDriver(url, auth={}, options={}) {
  const client = window.ds = deepstream(url, options).login(auth)

  function deepstreamDriver(action$, streamAdapter) {
    const cachedRecords = {}
    const cachedLists = {}

    // Internal event emitter to delegate between action 
    const events = new EventEmitter()
    const emit = (data) => events.emit('deepstream-event', data)
    
    function getRecord(name) {
      return new Promise((resolve, reject) => {
        const record = cachedRecords[name] === undefined ?
              client.record.getRecord(name) : cachedRecords[name]
        record.on('error', err => reject(err))
        record.whenReady(record => {
          cachedRecords[name] = record
          resolve(record)
        })
      })
    }

    function getList(name) {
      return new Promise((resolve, reject) => {
        const list = cachedLists[name] === undefined ?
              client.record.getList(name) : cachedList[name]
        list.on('error', err => reject(err))
        list.whenReady(list => {
          cachedLists[name] = list
          resolve(list)
        })
      })
    }

    const recordSubscription$ = action$.filter(intent => intent.action === 'record.subscribe')
    const recordSubscriptionListener = recordSubscription$.addListener({
      next: action => {
        getRecord(action.name).then(record => {
          record.subscribe(data => {
            emit({event:'record.change', name:action.name, data:data})
          }, true)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const recordSet$ = action$.filter(intent => intent.action === 'record.set')
    const recordSetListener = recordSet$.addListener({
      next: action => {
        getRecord(action.name).then(record => {
          record.set(action.path, action.data)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    
    const effect$ = xs.create({
      start: listener => {
        events.on('deepstream-event', event => {
          listener.next(event)
        })
      },
      stop: () => {}
    })
    
    return effect$
  }

  return deepstreamDriver
}
