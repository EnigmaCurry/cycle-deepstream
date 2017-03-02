const DeepstreamServer = require('deepstream.io')

const server = new DeepstreamServer({
  host: 'localhost',
  port: 6020
})

server.start()
