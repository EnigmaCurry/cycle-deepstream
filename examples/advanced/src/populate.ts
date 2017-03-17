const deepstream = require('deepstream.io-client-js')

const ds = deepstream('localhost:6020').login({ username: 'john', password: 'join' })
