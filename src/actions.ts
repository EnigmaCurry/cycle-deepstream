// Plain object action descriptors - 
// There are just helper functions to help you build the objects that
// the cycle driver interacts with.

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
  subscribe: (list: string, events = {}, scope?: string) => ({ action: 'list.subscribe', name: list, events }),
  getEntries: (list: string, scope?: string) => ({ action: 'list.getEntries', name: list }),
  setEntries: (list: string, entries: Array<any>, scope?: string) => ({ action: 'list.setEntries', name: list, entries }),
  addEntry: (list: string, entry: string, index?: number, scope?: string) => ({ action: 'list.addEntry', name: list, entry, index }),
  removeEntry: (list: string, entry: string, scope?: string) => ({ action: 'list.removeEntry', name: list, entry }),
  discard: (list: string, scope?: string) => ({ action: 'list.discard', name: list }),
  delete: (list: string, scope?: string) => ({ action: 'list.delete', name: list })
}

export const rpc = {
  make: (method: string, data: Object, scope?: string) => ({ action: 'rpc.make', method: method, data, scope })
}

export const scope = (scope: string) => {
  return (data: Object) => {
    return { ...data, scope }
  }
}
