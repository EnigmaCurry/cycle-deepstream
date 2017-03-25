import * as deepstream from 'deepstream.io-client-js'
import DeepstreamRecord from 'deepstream.io-client-js/src/record/record'
import * as fetch from 'node-fetch'

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

