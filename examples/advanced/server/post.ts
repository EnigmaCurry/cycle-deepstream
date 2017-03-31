import { getRecord, getList, RPC } from './deepstream_util'

type Post = {
  //The parent post
  parent: string,
  //The top most post on the page, if null the record name will be
  //used and this will be treated as a top-level post
  root: string | null,
  //Post title (optional on non-root posts):
  title: string | null,
  //Post content:
  content: string
}

export const createPost: RPC = {
  rpcMethod: 'create-post',
  validator: (post: Post) => {
    const subgroupRegex = /^p\/([a-zA-Z0-9_-]+\/?)$/;
    const parentRegex = /^p\/([a-zA-Z0-9_-]+\/?)+$/;
    //Is post top-level or a sub-post?
    let isTopLevel = false
    if (subgroupRegex.test(post.parent)) {
      if (post.root !== null) {
        return { isValid: false, error: 'root must be null when parent post is top-level' }
      }
      isTopLevel = true
    } else if (!parentRegex.test(post.root)) {
      return { isValid: false, error: 'sub-posts require a valid root parameter' }
    }
    if (!parentRegex.test(post.parent)) {
      return { isValid: false, error: 'bad parent post id' }
    } else if (isTopLevel && (post.title.length < 1 || post.title.length > 300)) {
      //Top-level posts require titles, sub posts do not:
      return { isValid: false, error: 'title must be between 1-300 characters' }
    } else if (post.content.length < 1 || post.content.length > 40000) {
      return { isValid: false, error: 'content must be between 1-40000 characters' }
    } else {
      return { isValid: true, error: null }
    }
  },
  callback: (client, post: Post, response) => {
    getRecord(client, post.parent).then((parent: deepstreamIO.Record) => {
      getList(client, `${parent.name}/children`)
        .then((siblings: deepstreamIO.List) => {
          getRecord(client, `${parent.get('root')}/${client.getUid()}`)
            .then((record: deepstreamIO.Record) => {
              record.set(<any>{
                root: post.root || record.name,
                parent: parent.name,
                title: post.title,
                content: post.content,
                depth: typeof parent.get('depth') !== 'number' ? 0 : parent.get('depth') + 1
              }, err => {
                if (err) {
                  throw new Error('database error')
                } else {
                  siblings.addEntry(record.name)
                  response.send(record.name)
                }
              })
            })
        }).catch(e => {
          throw new Error('database error')
        })
    })
  }
}
