export function login(auth) {
  return { action: 'login', auth }
}

export function logout() {
  return { action: 'logout' }
}

export const record = {
  subscribe: (record: string) => ({ action: 'record.subscribe', name: record })
}

export const list = {
  subscribe: (record: string) => ({ action: 'list.subscribe', name: record })
}
