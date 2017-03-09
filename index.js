import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import deepstream from 'deepstream.io-client-js'
import {EventEmitter} from 'events'

export function makeDeepstreamDriver(url, options={}) {

  if (url === undefined) {
    throw new Error('must specify deepstream host:PORT')
  }
  
  return function deepstreamDriver(action$, streamAdapter) {
    let client
    let cachedRecords = {}
    let cachedLists = {}
    
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

    const login$ = action$.filter(intent => intent.action === 'login')
    const loginListener = login$.addListener({
      next: intent => {
        if (client !== undefined) {
          client.close()
        }
        // Delete caches:
        cachedRecords = {}
        cachedLists = {}
        client = deepstream(url).login(intent.auth, (success, data) => {
          if (success) {
            emit({event:'login.success', data})
          } else {
            emit({event:'login.failure', data})
          }
        })
        client.on('error', (error) => {
          emit({event: 'client.error', error})
        })
        client.on('connectionStateChanged', (state) => {
          emit({event: 'connection.state', state})
        })
      },
      error: () => {},
      complete: () => {}
    })

    const logout$ = action$.filter(intent => intent.action === 'logout')
    const logoutListener = logout$.addListener({
      next: intent => {
        // Delete caches:
        cachedRecords = {}
        cachedLists = {}
        if (client !== undefined) {
          client.close()
        }
        emit({event:'logout'})
      },
      error: () => {},
      complete: () => {}
    })
    
    const recordSubscription$ = action$.filter(intent => intent.action === 'record.subscribe'
                                               && intent.name != undefined)
    const recordSubscriptionListener = recordSubscription$.addListener({
      next: intent => {
        getRecord(intent.name).then(record => {
          record.subscribe(data => {
            emit({event:'record.change', name:record.name, data:data})
          }, true)
          record.on('discard', () => {
            emit({event:'record.discard', name:record.name})
          })
          record.on('delete', () => {
            emit({event:'record.delete', name:record.name})
          })
          record.on('error', (err) => {
            emit({event:'record.error', name:record.name, error:err})
          })          
        })
      },
      error: () => {},
      complete: () => {}      
    })
    
    const recordGet$ = action$.filter(intent => intent.action === 'record.get'
                                      && intent.name != undefined)
    const recordGetListener = recordGet$.addListener({
      next: intent => {
        getRecord(intent.name).then(record => {
          emit({event:'record.get', name: record.name, data: record})
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const recordSnapshot$ = action$.filter(intent => intent.action === 'record.snapshot'
                                           && intent.name != undefined)
    const recordSnapshotListener = recordSnapshot$.addListener({
      next: intent => {
        client.record.snapshot(intent.name, record => {
          emit({event:'record.snapshot',  name: record.name, data: record})
        })
      },
      error: () => {},
      complete: () => {}      
    })

    
    const recordSet$ = action$.filter(intent => intent.action === 'record.set'
                                      && intent.name != undefined
                                      && intent.data != undefined)
    const recordSetListener = recordSet$.addListener({
      next: intent => {
        getRecord(intent.name).then(record => {
          record.set(intent.path, intent.data)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const recordDelete$ = action$.filter(intent => intent.action === 'record.delete'
                                         && intent.name != undefined)
    const recordDeleteListener = recordDelete$.addListener({
      next: intent => {
        getRecord(intent.name).then(record => {
          record.unsubscribe()
          record.delete()
          delete cachedRecords[record.name]
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const recordDiscard$ = action$.filter(intent => intent.action === 'record.discard'
                                          && intent.name != undefined)
    const recordDiscardListener = recordDiscard$.addListener({
      next: intent => {
        getRecord(intent.name).then(record => {
          record.unsubscribe()
          record.discard()
          delete cachedRecords[record.name]
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const recordListen$ = action$.filter(intent => intent.action === 'record.listen'
                                         && intent.pattern != undefined)
    const recordListenListener = recordListen$.addListener({
      next: intent => {
        client.record.listen(intent.pattern, (match, isSubscribed, response) => {
          response.accept()
          emit({event:'record.listen', match, isSubscribed})
        })
      },
      error: () => {},
      complete: () => {}      
    })
    
    const listSubscription$ = action$.filter(intent => intent.action === 'list.subscribe'
                                             && intent.name != undefined)
    const listSubscriptionListener = listSubscription$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.subscribe(data => {
            emit({event:'list.change', name:list.name, data:data})
          }, true)
          list.on('discard', () => {
            emit({event:'list.discard', name:list.name})
          })
          list.on('delete', () => {
            emit({event:'list.delete', name:list.name})
          })
          list.on('error', (err) => {
            emit({event:'list.error', name:list.name, error:err})
          })
          list.on('entry-added', (entry, position) => {
            emit({event:'list.entry-added', name:list.name, entry, position})
          })
          list.on('entry-moved', (entry, position) => {
            emit({event:'list.entry-moved', name:list.name, entry, position})
          })
          list.on('entry-removed', (entry, position) => {
            emit({event:'list.entry-removed', name:list.name, entry, position})
          })
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listGetEntries$ = action$.filter(intent => intent.action === 'list.getEntries'
                                           && intent.name != undefined)
    const listGetEntriesListener = listGetEntries$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          emit({event:'list.getEntries', name: list.name, data: list.getEntries()})
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listSetEntries$ = action$.filter(intent => intent.action === 'list.setEntries'
                                           && intent.entries != undefined
                                           && intent.name != undefined)
    const listSetEntriesListener = listSetEntries$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.setEntries(intent.entries)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listAddEntry$ = action$.filter(intent => intent.action === 'list.addEntry'
                                         && intent.name != undefined
                                         && intent.entry != undefined)
    const listAddEntryListener = listAddEntry$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.addEntry(intent.entry, intent.index)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listRemoveEntry$ = action$.filter(intent => intent.action === 'list.removeEntry'
                                            && intent.name != undefined
                                            && intent.entry != undefined)
    const listRemoveEntryListener = listRemoveEntry$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.removeEntry(intent.entry, intent.index)
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listDelete$ = action$.filter(intent => intent.action === 'list.delete'
                                       && intent.name != undefined)
    const listDeleteListener = listDelete$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.unsubscribe()
          list.delete()
          delete cachedLists[list.name]
        })
      },
      error: () => {},
      complete: () => {}      
    })

    const listDiscard$ = action$.filter(intent => intent.action === 'list.discard'
                                        && intent.name != undefined)
    const listDiscardListener = listDiscard$.addListener({
      next: intent => {
        getList(intent.name).then(list => {
          list.unsubscribe()
          list.discard()
          delete cachedLists[list.name]
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
    
    return adapt(effect$)
  }
}
