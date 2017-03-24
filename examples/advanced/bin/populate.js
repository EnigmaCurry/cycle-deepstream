const deepstream = require('deepstream.io-client-js')
const fetch = require('node-fetch')

const host = 'localhost:6020'

function waitForDeepstream(host, retries = 30, wait=3000) {
  return new Promise((accept, reject) => {
    console.log(`Waiting for deepstream health-check (${retries} retries left) ...`)
    fetch(`http://${host}/health-check`)
      .catch(err => {
        if (retries > 0) {
          setTimeout(() => {
            waitForDeepstream(host, retries - 1)
              .then(res => accept())
              .catch(err => reject("Deepstream never responded"))
          }, wait)
        } else {
          reject("Deepstream never responded")
        }
      })
      .then(res => {
        if (res !== undefined) {
          console.log("Deepstream ready.")
          accept()
        }
      })
  })
}

waitForDeepstream(host)
  .then(res => {
    const ds = deepstream(host).login({ username: 'john', password: 'john' })
    ds.on('connectionStateChanged', state => {
      if (state === deepstream.CONSTANTS.CONNECTION_STATE.OPEN) {
        // Populate the database with initial test data
        ds.record.getRecord('p/main').whenReady(main => {
          if (main.get().content === undefined) {
            main.set({title:'From Me to You', content:' * one\n * two\n * three\n'}) 
            const child1 = ds.record.getRecord('p/main/child1')
            child1.set({content:'This is child1'})
            const child2 = ds.record.getRecord('p/main/child2')
            child2.set({content:'This is child2'})
            const children = ds.record.getList('p/main/children')
            children.setEntries([child1.name, child2.name])
            const grandchildren = ds.record.getList('p/main/child1/children')
            const grandchild1 = ds.record.getRecord('p/main/child1/grandchild1')
            grandchild1.set({content:'This is a child of a child'})
            grandchildren.addEntry(grandchild1.name)
            grandchildren.on('discard', _ => {
              console.log("Populated database")
              ds.close()
            })
            grandchildren.discard()
          } else {
            console.log("Database already populated")
            ds.close()
          }
        })    
      }
    })
  })
  .catch(err => {
    console.error(err)
  })



