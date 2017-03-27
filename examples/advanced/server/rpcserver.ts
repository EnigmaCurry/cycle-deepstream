import { connect, provideValidatedRPC, RPC } from './deepstream_util'
import { createPost } from './post'
import { populate } from './populate'

const host = 'localhost:6020'
const auth = { username: 'admin', password: 'admin' }

const services: Array<RPC> = [createPost]

connect({ host, auth }).then(client => {
  services.map(service => provideValidatedRPC(client, service))
  populate(client)
})

