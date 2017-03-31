import { getRecord, getList, setAsync, RPC } from './deepstream_util'

//Initial test data populate:
export function populate(client: deepstreamIO.Client) {
  getRecord(client, 'p/main/sticky').then((main: deepstreamIO.Record) => {
    setAsync(main, {
      root: main.name,
      title: 'From me to You',
      content: ' * one\n * two\n * three\n',
      depth: 0
    })
  })
}
