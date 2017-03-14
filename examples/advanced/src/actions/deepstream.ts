export function login(auth) {
  return { action: 'login', auth }
}

export function logout() {
  return { action: 'logout' }
}

export const record = {
  subscribe: (record: string, events = {}) => ({ action: 'record.subscribe', name: record, events: events })
}

export const list = {
  subscribe: (record: string, events = {}) => ({ action: 'list.subscribe', name: record, events: events })
}
