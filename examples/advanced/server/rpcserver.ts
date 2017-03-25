import { connect, getRecord, getList, setAsync } from './deepstream_util'

const host = 'localhost:6020'
const auth = { username: 'admin', password: 'admin' }

function provideCreatePostRPC(client: deepstreamIO.Client) {
  client.rpc.provide('create-post', ({parent, title, content}, response: deepstreamIO.RPCResponse) => {
    if (/^p\/([a-zA-Z0-9_-]+\/?)+$/.test(parent)) {
      getRecord(client, parent).then((parent: deepstreamIO.Record) => {
        getList(client, `${parent.name}/children`)
          .then((siblings: deepstreamIO.List) => {
            getRecord(client, `${parent.get('root')}/${client.getUid()}`)
              .then((record: deepstreamIO.Record) => {
                record.set(<any>{
                  root: parent.get('root'),
                  parent: parent.name,
                  title,
                  content
                }, err => {
                  if (err) {
                    response.error('database error')
                  } else {
                    siblings.addEntry(record.name)
                    response.send(record.name)
                  }
                })
              })
          }).catch(e => {
            response.error('database error')
          })
      })
    } else {
      response.error('bad parent id')
    }
  })
}

//Initial test data populate:
function populate(client: deepstreamIO.Client) {
  getRecord(client, 'p/main').then((main: deepstreamIO.Record) => {
    setAsync(main, {
      root: 'p/main',
      title: 'From me to You',
      content: ' * one\n * two\n * three\n'
    }).then(() => {
      client.rpc.make('create-post', { parent: main.name, content: 'this is child1' }, (err, postId) => {
        client.rpc.make('create-post', { parent: postId, content: 'this is a child of a child' }, (err, postId) => {
        })
      })
      client.rpc.make('create-post', { parent: main.name, content: 'this is child2' }, (err, postId) => { })
    })

  })
}

connect({ host, auth }).then(client => {
  provideCreatePostRPC(client)
  populate(client)
})

