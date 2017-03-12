export function login(username, password) {
  return { action: 'login', auth: { username, password } }
}

export function logout() {
  return { action: 'logout' }
}

export function subscribe(record: string) {
  return { action: 'record.subscribe', name: record }
}
