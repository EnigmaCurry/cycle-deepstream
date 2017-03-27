import * as deepstream from 'deepstream.io-client-js'
import DeepstreamRecord from 'deepstream.io-client-js/src/record/record'
import * as fetch from 'node-fetch'

export type RPC = {
  rpcMethod: string,
  validator: (data) => { isValid: boolean, error: string },
  callback: (client: deepstreamIO.Client, data, response: deepstreamIO.RPCResponse) => void
}

export function waitForDeepstream({host, retries = 30, wait = 3000, log = console.log}) {
  return new Promise((accept, reject) => {
    log(`Waiting for deepstream health-check (${retries} retries left) ...`)
    fetch(`http://${host}/health-check`)
      .catch(err => {
        if (retries > 0) {
          setTimeout(() => {
            waitForDeepstream({ host, retries: retries - 1 })
              .then(res => accept())
              .catch(err => reject("Deepstream never responded"))
          }, wait)
        } else {
          reject("Deepstream never responded")
        }
      })
      .then(res => {
        if (res !== undefined) {
          log("Deepstream ready.")
          accept()
        }
      })
  })
}

export function getRecord(client: deepstreamIO.Client, name: string) {
  return new Promise(resolve => {
    client.record.getRecord(name).whenReady(record => resolve(record))
  })
}

export function getList(client: deepstreamIO.Client, name: string) {
  return new Promise(resolve => {
    client.record.getList(name).whenReady(list => resolve(list))
  })
}

export function setAsync(record: deepstreamIO.Record, value) {
  return new Promise((resolve, reject) => {
    record.set(value, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(record)
      }
    })
  })
}

export function connect({host, auth}): Promise<deepstreamIO.Client> {
  return new Promise((resolve, reject) => {
    waitForDeepstream({ host })
      .then(res => {
        const client = deepstream(host).login(auth)
        client.on('connectionStateChanged', state => {
          if (state === (<any>deepstream.CONSTANTS.CONNECTION_STATE).OPEN) {
            resolve(client)
          }
        })
      }).catch(err => {
        console.error(err)
      })
  })
}

//Creates an RPC with seperate validator and action methods.
//Allows validator code to just focus on validating input parameters.
//Allows rpc code to just focus on handling a request and returning data.
//Validator function should return error messages appropriate for an end user.
//Error messages from the actual rpc method are hidden from the end user.
export function provideValidatedRPC(client: deepstreamIO.Client, rpc: RPC) {
  client.rpc.provide(rpc.rpcMethod, (data, response: deepstreamIO.RPCResponse) => {
    const {error, isValid} = rpc.validator(data)
    if (error) {
      response.error(`data provided to ${rpc.rpcMethod} rpc call was invalid: ${error}`)
    } else if (!isValid) {
      response.error(`data provided to ${rpc.rpcMethod} rpc call was invalid for unspecified reasons`)
    } else {
      try {
        rpc.callback(client, data, response)
      } catch (e) {
        response.error(`Internal error in ${rpc.rpcMethod} rpc call`)
      }
    }
  })
}

