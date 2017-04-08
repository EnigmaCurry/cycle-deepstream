import { Driver } from '@cycle/run'
import xs, { Stream } from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'
import concat from 'xstream/extra/concat'
import * as deepstream from 'deepstream.io-client-js'
import { EventEmitter } from 'events'
const stringify = require('json-stringify-safe')

export type Intent = {
  action: string,
  name?: string
}

export type LoginIntent = {
  action: string,
  name?: string,
  auth: Object
}

export type SubscribeIntent = {
  action: string,
  name?: string,
  events: Object
}

export type RecordSetIntent = {
  action: string,
  name?: string,
  data: Object,
  path?: string,
  acknowledge?: boolean
}

export type ListSetIntent = {
  action: string,
  name?: string,
  entries: Array<string>
}

export type ListEntryIntent = {
  action: string,
  name?: string,
  entry: string,
  index: number
}

export type ListenIntent = {
  action: string,
  name?: string,
  pattern: string
}

export type RPCIntent = {
  action: string,
  method: string,
  data: Object
}

export type Event = {
  event: string,
  name?: string,
  data?: any,
  entry?: string,
  position?: number,
  error?: string,
  state?: string,
  match?: string,
  isSubscribed?: boolean
}

export type CycleDeepstream = Driver<Stream<Intent>, Stream<Event>>

export function makeDeepstreamDriver({url, options = {}, debug = false}:
  { url: string, options?: Object, debug?: boolean }): CycleDeepstream {

  let client: deepstreamIO.Client
  let cachedRecords: any = {}
  let cachedLists: any = {}
  const log = console.debug === undefined ? console.log : console.debug

  return function deepstreamDriver(action$) {
    // Internal event emitter to delegate between action and response 
    const deepstreamEvents = new EventEmitter()

    // The stream of events we will return from this driver:
    const response$: Stream<Event> = fromEvent(deepstreamEvents, 'deepstream-event')
    // Log the events that the output stream sees
    // This also ensures that the stream is created now, and ensures
    // emitted events have a valid listener.
    response$.addListener({
      next: i => logEvent(i)
    })

    const emit = (data: Event) => {
      deepstreamEvents.emit('deepstream-event', data)
    }

    function logAction(...msgs: Array<string>) {
      if (debug)
        log.apply(null, ['deepstream action:', ...msgs])
    }

    function logEvent(event: any) {
      if (event['error'] !== undefined) {
        /* istanbul ignore next */
        console.error('deepstream error:', stringify(event))
      } else if (debug) {
        log('deepstream event:', stringify(event))
      }
    }

    function getRecord(name: string): Promise<deepstreamIO.Record> {
      return new Promise((resolve, reject) => {
        const record = cachedRecords[name] === undefined ?
          client.record.getRecord(name) : cachedRecords[name]
        record.on('error', /* istanbul ignore next */(err: string) => reject(err))
        record.whenReady((record: deepstreamIO.Record) => {
          cachedRecords[name] = record
          resolve(record)
        })
      })
    }

    function getList(name: string): Promise<deepstreamIO.List> {
      return new Promise((resolve, reject) => {
        const list = cachedLists[name] === undefined ?
          client.record.getList(name) : cachedLists[name]
        list.on('error', /* istanbul ignore next */(err: string) => reject(err))
        list.whenReady((list: deepstreamIO.List) => {
          cachedLists[name] = list
          resolve(list)
        })
      })
    }

    /* istanbul ignore next */
    const noop = () => { }

    const login$ = action$.filter(intent => intent.action === 'login')
    const loginListener = login$.addListener({
      next: (intent: LoginIntent) => {
        logAction(intent.action, '(auth details hidden)')
        if (client !== undefined) {
          client.close()
        }
        // Delete caches:
        cachedRecords = {}
        cachedLists = {}
        client = deepstream(url, options).login(
          intent.auth, (success: boolean, data: Object) => {
            if (success) {
              emit({ event: 'login.success', data })
            } else {
              emit({ event: 'login.failure', data })
            }
          })
        client.on('error', (error: string) => {
          emit({ event: 'client.error', error })
        })
        client.on('connectionStateChanged', (state: string) => {
          emit({ event: 'connection.state', state })
        })
      },
      error: noop,
      complete: noop
    })

    const logout$ = action$.filter(intent => intent.action === 'logout')
    const logoutListener = logout$.addListener({
      next: intent => {
        logAction(intent.action)
        // Delete caches:
        cachedRecords = {}
        cachedLists = {}
        if (client !== undefined) {
          client.close()
        }
        emit({ event: 'logout' })
      },
      error: noop,
      complete: noop
    })

    const recordSubscription$ = action$.filter(intent => intent.action === 'record.subscribe'
      && intent.name !== undefined)
    const recordSubscriptionListener = recordSubscription$.addListener({
      next: (intent: SubscribeIntent) => {
        const events = Object.assign({
          //record.existing will fire record.change for existing values on subscribe
          'record.existing': true,
          'record.change': true,
          'record.discard': true,
          'record.delete': true,
          'record.error': true
        }, intent.events)
        logAction(intent.action, intent.name, intent.events ? stringify(intent.events) : '')
        getRecord(intent.name).then(record => {
          if (events['record.change']) {
            record.subscribe((data: Object) => {
              emit({ event: 'record.change', name: record.name, data: data })
            }, events['record.existing'])
          }
          if (events['record.discard']) {
            record.on('discard', () => {
              emit({ event: 'record.discard', name: record.name })
            })
          }
          if (events['record.delete']) {
            record.on('delete', () => {
              emit({ event: 'record.delete', name: record.name })
            })
          }
          if (events['record.error']) {
            record.on('error', (err: string) => {
              emit({ event: 'record.error', name: record.name, error: err })
            })
          }
        })
      },
      error: noop,
      complete: noop
    })

    const recordGet$ = action$.filter(intent => intent.action === 'record.get'
      && intent.name !== undefined)
    const recordGetListener = recordGet$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getRecord(intent.name).then(record => {
          emit({ event: 'record.get', name: record.name, data: record.get() })
        })
      },
      error: noop,
      complete: noop
    })

    const recordSnapshot$ = action$.filter(intent => intent.action === 'record.snapshot'
      && intent.name !== undefined)
    const recordSnapshotListener = recordSnapshot$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        client.record.snapshot(intent.name, (error, data) => {
          emit({ event: 'record.snapshot', name: intent.name, data })
        })
      },
      error: noop,
      complete: noop
    })


    const recordSet$ = action$.filter(intent => intent.action === 'record.set'
      && intent.name !== undefined
      && (<RecordSetIntent>intent).data !== undefined)
    const recordSetListener = recordSet$.addListener({
      next: (intent: RecordSetIntent) => {
        logAction(intent.action, intent.name)
        const writeCallback = (error: string) => {
          if (error) {
            console.error(error)
          } else {
            emit({ event: 'record.set', name: intent.name })
          }
        }
        getRecord(intent.name).then(record => {
          if (typeof intent.path === 'undefined') {
            if (intent.acknowledge) {
              record.set(intent.data, writeCallback)
            } else {
              record.set(intent.data)
            }
          } else {
            if (intent.acknowledge) {
              record.set(intent.path, intent.data, writeCallback)
            } else {
              record.set(intent.path, intent.data)
            }
          }
        })
      },
      error: noop,
      complete: noop
    })

    const recordDelete$ = action$.filter(intent => intent.action === 'record.delete'
      && intent.name !== undefined)
    const recordDeleteListener = recordDelete$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getRecord(intent.name).then(record => {
          record.unsubscribe()
          record.delete()
          delete cachedRecords[record.name]
        })
      },
      error: noop,
      complete: noop
    })

    const recordDiscard$ = action$.filter(intent => intent.action === 'record.discard'
      && intent.name !== undefined)
    const recordDiscardListener = recordDiscard$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getRecord(intent.name).then(record => {
          record.unsubscribe()
          record.discard()
          delete cachedRecords[record.name]
        })
      },
      error: noop,
      complete: noop
    })

    const recordListen$ = action$.filter(intent => intent.action === 'record.listen'
      && (<ListenIntent>intent).pattern !== undefined)
    const recordListenListener = recordListen$.addListener({
      next: (intent: ListenIntent) => {
        logAction(intent.action, intent.name)
        client.record.listen(intent.pattern, (match, isSubscribed, response) => {
          response.accept()
          emit({ event: 'record.listen', match, isSubscribed })
        })
      },
      error: noop,
      complete: noop
    })

    const listSubscription$ = action$.filter(intent => intent.action === 'list.subscribe'
      && intent.name !== undefined)
    const listSubscriptionListener = listSubscription$.addListener({
      next: (intent: SubscribeIntent) => {
        const events = Object.assign({
          'list.change': true,
          'list.entry-existing': true,
          'list.discard': true,
          'list.delete': true,
          'list.error': true,
          'list.entry-added': true,
          'list.entry-moved': true,
          'list.entry-removed': true
        }, intent.events)
        logAction(intent.action, intent.name, intent.events ? stringify(intent.events) : '')
        getList(intent.name).then(list => {
          // Is this the first time the subscription callback is called?
          let callbackFirstCall = true
          list.subscribe((data: Array<string>) => {
            if (events['list.change']) {
              emit({ event: 'list.change', name: list.name, data: data })
            }
            // Only do this the *first* time the callback is called, on subscription:
            if (events['list.entry-existing'] && callbackFirstCall) {
              for (let i = 0; i < data.length; i++) {
                emit({ event: 'list.entry-existing', name: list.name, entry: data[i], position: i })
              }
            }
            callbackFirstCall = false
          }, true)
          if (events['list.discard']) {
            list.on('discard', () => {
              emit({ event: 'list.discard', name: list.name })
            })
          }
          if (events['list.delete']) {
            list.on('delete', () => {
              emit({ event: 'list.delete', name: list.name })
            })
          }
          if (events['list.error']) {
            list.on('error', (err: string) => {
              emit({ event: 'list.error', name: list.name, error: err })
            })
          }
          if (events['list.entry-added']) {
            list.on('entry-added', (entry: string, position: number) => {
              emit({ event: 'list.entry-added', name: list.name, entry, position })
            })
          }
          if (events['list.entry-moved']) {
            list.on('entry-moved', (entry: string, position: number) => {
              emit({ event: 'list.entry-moved', name: list.name, entry, position })
            })
          }
          if (events['list.entry-removed']) {
            list.on('entry-removed', (entry: string, position: number) => {
              emit({ event: 'list.entry-removed', name: list.name, entry, position })
            })
          }
        })
      },
      error: noop,
      complete: noop
    })

    const listGetEntries$ = action$.filter(intent => intent.action === 'list.getEntries'
      && intent.name !== undefined)
    const listGetEntriesListener = listGetEntries$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          emit({ event: 'list.getEntries', name: list.name, data: list.getEntries() })
        })
      },
      error: noop,
      complete: noop
    })

    const listSetEntries$ = action$.filter(intent => intent.action === 'list.setEntries'
      && (<ListSetIntent>intent).entries !== undefined
      && intent.name !== undefined)
    const listSetEntriesListener = listSetEntries$.addListener({
      next: (intent: ListSetIntent) => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.setEntries(intent.entries)
        })
      },
      error: noop,
      complete: noop
    })

    const listAddEntry$ = action$.filter(intent => intent.action === 'list.addEntry'
      && intent.name !== undefined
      && (<ListEntryIntent>intent).entry !== undefined)
    const listAddEntryListener = listAddEntry$.addListener({
      next: (intent: ListEntryIntent) => {
        logAction(intent.action, intent.name, intent.entry)
        getList(intent.name).then(list => {
          list.addEntry(intent.entry, intent.index)
        })
      },
      error: noop,
      complete: noop
    })

    const listRemoveEntry$ = action$.filter(intent => intent.action === 'list.removeEntry'
      && intent.name !== undefined
      && (<ListEntryIntent>intent).entry !== undefined)
    const listRemoveEntryListener = listRemoveEntry$.addListener({
      next: (intent: ListEntryIntent) => {
        logAction(intent.action, intent.name, intent.entry)
        getList(intent.name).then(list => {
          list.removeEntry(intent.entry, intent.index)
        })
      },
      error: noop,
      complete: noop
    })

    const listDelete$ = action$.filter(intent => intent.action === 'list.delete'
      && intent.name !== undefined)
    const listDeleteListener = listDelete$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.delete()
          delete cachedLists[list.name]
        })
      },
      error: noop,
      complete: noop
    })

    const listDiscard$ = action$.filter(intent => intent.action === 'list.discard'
      && intent.name !== undefined)
    const listDiscardListener = listDiscard$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.discard()
          delete cachedLists[list.name]
        })
      },
      error: noop,
      complete: noop
    })

    const rpcMake$ = action$.filter((intent: RPCIntent) => intent.action === 'rpc.make'
      && intent.method !== undefined)
    const rpcMakeListener = rpcMake$.addListener({
      next: (intent: RPCIntent) => {
        logAction(intent.action, intent.method, stringify(intent.data))
        client.rpc.make(intent.method, intent.data, (error, result) => {
          if (error) {
            throw new Error(error)
          }
          // TODO how to link the rpc response to the original request? new ID?
        })
      },
      error: noop,
      complete: noop
    })

    return response$
  }
}
