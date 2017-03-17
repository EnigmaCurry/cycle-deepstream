const deepstream = require('deepstream.io-client-js')

const ds = deepstream('localhost:6020').login({ username: 'john', password: 'john' })

const main = ds.record.getRecord('p/main')
main.set({content:'# Hello Markdown\n\n * one\n * two\n * three\n'})

const child1 = ds.record.getRecord('p/main/child1')
child1.set({content:'This is child1'})

const children = ds.record.getList('p/main/children')
children.addEntry(child1.name)
