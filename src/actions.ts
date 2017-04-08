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
  set: (record: string, data: Object) => ({ action: 'record.set', name: record, data }),
  discard: (record: string) => ({ action: 'record.discard', name: record }),
  delete: (record: string) => ({ action: 'record.delete', name: record }),
}

export const list = {
  subscribe: (record: string, events = {}) => ({ action: 'list.subscribe', name: record, events: events }),
  getEntries: (record: string) => ({ action: 'list.getEntries', name: record }),
  addEntry: (record: string, entry: string, index?: number) => ({ action: 'list.addEntry', name: record, entry, index }),
  removeEntry: (record: string, entry: string) => ({ action: 'list.removeEntry', name: record, entry })
}

export const rpc = {
  make: (method: string, data: Object) => ({ action: 'rpc.make', method: method, data })
}
