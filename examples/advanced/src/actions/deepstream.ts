export function login(username, password) {
  return { action: 'login', auth: { username, password } }
}

export function logout() {
  return { action: 'logout' }
}
