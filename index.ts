import { Driver } from '@cycle/run'
import xs, { Stream } from 'xstream'
import * as deepstream from 'deepstream.io-client-js'
import { EventEmitter } from 'events'

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

export function makeDeepstreamDriver({url, options = {}, debug = false}:
  { url: string, options?: Object, debug?: boolean }): Driver<Stream<Intent>, Stream<Event>> {

  return function deepstreamDriver(action$) {

    let client: deepstreamIO.Client
    let cachedRecords: any = {}
    let cachedLists: any = {}

    // Internal event emitter to delegate between action 
    const events = new EventEmitter()
    const emit = (data: Event) => {
      logEvent(data)
      events.emit('deepstream-event', data)
    }

    function logAction(...msgs: Array<string>) {
      if (debug)
        console.debug.apply(null, ['deepstream action:', ...msgs])
    }

    function logEvent(event: any) {
      if (event['error'] !== undefined) {
        console.error('deepstream error:', JSON.stringify(event))
      } else if (debug) {
        console.debug('deepstream event:', JSON.stringify(event))
      }

    }

    function getRecord(name: string): Promise<deepstreamIO.Record> {
      return new Promise((resolve, reject) => {
        const record = cachedRecords[name] === undefined ?
          client.record.getRecord(name) : cachedRecords[name]
        record.on('error', (err: string) => reject(err))
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
        list.on('error', (err: string) => reject(err))
        list.whenReady((list: deepstreamIO.List) => {
          cachedLists[name] = list
          resolve(list)
        })
      })
    }

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
        client = (<any>window).ds = deepstream(url, options).login(
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
    })

    const recordSubscription$ = action$.filter(intent => intent.action === 'record.subscribe'
      && intent.name !== undefined)
    const recordSubscriptionListener = recordSubscription$.addListener({
      next: (intent: SubscribeIntent) => {
        const events = Object.assign({
          'record.change': true,
          'record.discard': true,
          'record.delete': true,
          'record.error': true
        }, intent.events)
        logAction(intent.action, intent.name, intent.events ? JSON.stringify(intent.events) : '')
        getRecord(intent.name).then(record => {
          if (events['record.change']) {
            record.subscribe((data: Object) => {
              emit({ event: 'record.change', name: record.name, data: data })
            }, true)
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
    })

    const recordSnapshot$ = action$.filter(intent => intent.action === 'record.snapshot'
      && intent.name !== undefined)
    const recordSnapshotListener = recordSnapshot$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        client.record.snapshot(intent.name, (error, record) => {
          emit({ event: 'record.snapshot', name: record.name, data: record.snapshot() })
        })
      },
      error: () => { },
      complete: () => { }
    })


    const recordSet$ = action$.filter(intent => intent.action === 'record.set'
      && intent.name !== undefined
      && (<RecordSetIntent>intent).data !== undefined)
    const recordSetListener = recordSet$.addListener({
      next: (intent: RecordSetIntent) => {
        logAction(intent.action, intent.name)
        getRecord(intent.name).then(record => {
          if (typeof intent.path === undefined) {
            record.set(intent.data)
          } else {
            record.set(intent.path, intent.data)
          }
        })
      },
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
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
        logAction(intent.action, intent.name, intent.events ? JSON.stringify(intent.events) : '')
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
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
      error: () => { },
      complete: () => { }
    })

    const listAddEntry$ = action$.filter(intent => intent.action === 'list.addEntry'
      && intent.name !== undefined
      && (<ListEntryIntent>intent).entry !== undefined)
    const listAddEntryListener = listAddEntry$.addListener({
      next: (intent: ListEntryIntent) => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.addEntry(intent.entry, intent.index)
        })
      },
      error: () => { },
      complete: () => { }
    })

    const listRemoveEntry$ = action$.filter(intent => intent.action === 'list.removeEntry'
      && intent.name !== undefined
      && (<ListEntryIntent>intent).entry !== undefined)
    const listRemoveEntryListener = listRemoveEntry$.addListener({
      next: (intent: ListEntryIntent) => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.removeEntry(intent.entry, intent.index)
        })
      },
      error: () => { },
      complete: () => { }
    })

    const listDelete$ = action$.filter(intent => intent.action === 'list.delete'
      && intent.name !== undefined)
    const listDeleteListener = listDelete$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.unsubscribe()
          list.delete()
          delete cachedLists[list.name]
        })
      },
      error: () => { },
      complete: () => { }
    })

    const listDiscard$ = action$.filter(intent => intent.action === 'list.discard'
      && intent.name !== undefined)
    const listDiscardListener = listDiscard$.addListener({
      next: intent => {
        logAction(intent.action, intent.name)
        getList(intent.name).then(list => {
          list.unsubscribe()
          list.discard()
          delete cachedLists[list.name]
        })
      },
      error: () => { },
      complete: () => { }
    })

    const rpcMake$ = action$.filter((intent: RPCIntent) => intent.action === 'rpc.make'
      && intent.method !== undefined)
    const rpcMakeListener = rpcMake$.addListener({
      next: (intent: RPCIntent) => {
        logAction(intent.action, intent.method, JSON.stringify(intent.data))
        client.rpc.make(intent.method, intent.data, (error, result) => {
          if (error) {
            throw new Error(error)
          }
          // TODO how to link the rpc response to the original request? new ID?
        })
      },
      error: () => { },
      complete: () => { }
    })

    return <Stream<Event>>xs.create({
      start: listener => {
        events.on('deepstream-event', (event: Event) => {
          listener.next(event)
        })
      },
      stop: () => { }
    })
  }
}
