import { getRecord, getList, setAsync, RPC } from './deepstream_util'

//Initial test data populate:
export function populate(client: deepstreamIO.Client) {
  getRecord(client, 'p/main/sticky').then((main: deepstreamIO.Record) => {
    setAsync(main, {
      root: main.name,
      title: 'From me to You',
      content: ' * one\n * two\n * three\n'
    }).then(() => {
      client.rpc.make('create-post', { parent: main.name, root: main.name, content: 'this is child1' }, (err, postId) => {
        if (err) throw new Error(err)
        client.rpc.make('create-post', { parent: postId, root: main.name, content: 'this is a child of a child' }, (err, postId) => {
          if (err) throw new Error(err)
        })
      })
      client.rpc.make('create-post', { parent: main.name, root: main.name, content: 'this is child2' }, (err, postId) => {
        if (err) throw new Error(err)
      })
    })
  })
}
