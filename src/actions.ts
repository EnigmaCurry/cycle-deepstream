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
  subscribe: (record: string, events = {}) => ({ action: 'record.subscribe', name: record, events: events }),
  snapshot: (record: string) => ({ action: 'record.snapshot', name: record }),
  get: (record: string) => ({ action: 'record.get', name: record }),
  set: (record: string, data: Object, acknowledge?: boolean) => ({ action: 'record.set', name: record, data, acknowledge }),
  setPath: (record: string, path: string, data: Object, acknowledge?: boolean) => ({ action: 'record.set', name: record, path, data, acknowledge }),
  discard: (record: string) => ({ action: 'record.discard', name: record }),
  delete: (record: string) => ({ action: 'record.delete', name: record }),
}

export const list = {
  subscribe: (list: string, events = {}) => ({ action: 'list.subscribe', name: list, events: events }),
  getEntries: (list: string) => ({ action: 'list.getEntries', name: list }),
  setEntries: (list: string, entries: Array<any>) => ({ action: 'list.setEntries', name: list, entries }),
  addEntry: (list: string, entry: string, index?: number) => ({ action: 'list.addEntry', name: list, entry, index }),
  removeEntry: (list: string, entry: string) => ({ action: 'list.removeEntry', name: list, entry }),
  discard: (list: string) => ({ action: 'list.discard', name: list }),
  delete: (list: string) => ({ action: 'list.delete', name: list })
}

export const rpc = {
  make: (method: string, data: Object) => ({ action: 'rpc.make', method: method, data })
}
