// Plain object action descriptors - 
// These are just helper functions to help you build the objects that
// the cycle driver interacts with.
import * as types from './types'

export function login(auth?: Object) {
  return { action: 'login', auth }
}

export function logout() {
  return { action: 'logout' }
}

export const record = {
  subscribe: (record: string, events = {}, scope?: string) => ({ action: 'record.subscribe', name: record, events, scope }),
  snapshot: (record: string, scope?: string) => ({ action: 'record.snapshot', name: record, scope }),
  get: (record: string, scope?: string) => ({ action: 'record.get', name: record, scope }),
  set: (record: string, data: Object, acknowledge?: boolean, scope?: string) => ({ action: 'record.set', name: record, data, acknowledge, scope }),
  setPath: (record: string, path: string, data: Object, acknowledge?: boolean, scope?: string) => ({ action: 'record.set', name: record, path, data, acknowledge, scope }),
  discard: (record: string, scope?: string) => ({ action: 'record.discard', name: record, scope }),
  delete: (record: string, scope?: string) => ({ action: 'record.delete', name: record, scope }),
  listen: (pattern: string, scope?: string) => ({ action: 'record.listen', pattern, scope })
}

export const list = {
  subscribe: (list: string, events = {}, scope?: string) => ({ action: 'list.subscribe', name: list, events, scope }),
  getEntries: (list: string, scope?: string) => ({ action: 'list.getEntries', name: list, scope }),
  setEntries: (list: string, entries: Array<any>, scope?: string) => ({ action: 'list.setEntries', name: list, entries, scope }),
  addEntry: (list: string, entry: string, index?: number, scope?: string) => ({ action: 'list.addEntry', name: list, entry, index, scope }),
  removeEntry: (list: string, entry: string, scope?: string) => ({ action: 'list.removeEntry', name: list, entry, scope }),
  discard: (list: string, scope?: string) => ({ action: 'list.discard', name: list, scope }),
  delete: (list: string, scope?: string) => ({ action: 'list.delete', name: list, scope })
}

export const rpc = {
  make: (method: string, data: Object, scope?: string) => ({ action: 'rpc.make', method: method, data, scope })
}

export const event = {
  subscribe: (event: string, scope?: string) => ({ action: 'event.subscribe', name: event, scope }),
  unsubscribe: (event: string, scope?: string) => ({ action: 'event.unsubscribe', name: event, scope }),
  emit: (name: string, data: any, scope?: string) => ({ action: 'event.emit', name, data, scope }),
  listen: (pattern: string, scope?: string) => ({ action: 'event.listen', pattern, scope }),
  unlisten: (pattern: string, scope?: string) => ({ action: 'event.unlisten', pattern, scope })
}

export const presence = {
  subscribe: (scope?: string) => ({ action: 'presence.subscribe', scope }),
  unsubscribe: (scope?: string) => ({ action: 'presence.unsubscribe', scope }),
  getAll: (scope?: string) => ({ action: 'presence.getAll', scope })
}

export const scope = (scope?: string): types.ScopeFunction => {
  if (typeof scope === 'undefined') {
    scope = (new Date()).getTime().toString(36) + (Math.random() * 1E18).toString(36)
  }
  const func: types.ScopeFunction = (data: Object) => {
    return { ...data, scope }
  }
  func.scope = scope
  return func
}
