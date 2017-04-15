cycle-deepstream
=====================

[![Build Status](https://travis-ci.org/EnigmaCurry/cycle-deepstream.svg?branch=master)](https://travis-ci.org/EnigmaCurry/cycle-deepstream)
[![npm version](https://img.shields.io/npm/v/cycle-deepstream.svg?maxAge=86400)](https://www.npmjs.com/package/cycle-deepstream)
[![Coverage Status](https://coveralls.io/repos/github/EnigmaCurry/cycle-deepstream/badge.svg?branch=master)](https://coveralls.io/github/EnigmaCurry/cycle-deepstream?branch=master)
[![Join the chat at https://gitter.im/EnigmaCurry/cycle-deepstream](https://badges.gitter.im/EnigmaCurry/cycle-deepstream.svg)](https://gitter.im/EnigmaCurry/cycle-deepstream?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A [Cycle.js](https://cycle.js.org/) driver for the [deepstream.io](https://deepstream.io) javascript client.

Allows realtime communication between multiple clients and your cluster of deepstream servers. A self-hosted firebase replacement.

![giphy](https://cloud.githubusercontent.com/assets/43061/23532850/f8351d38-ff7b-11e6-9645-905309d7ee05.gif)

*(above: The simple example running in three browser windows)*


Run Demo
----------
Get the code:

    git clone https://github.com/EnigmaCurry/cycle-deepstream.git
    cd cycle-deepstream
    npm install
    
Run the simple example:

    npm run simple

Or run the advanced demo:

    npm run advanced

Usage Notes
-------------

No formal docs exist for this yet. This driver implements most of the [deepstream API methods](https://deepstream.io/docs/client-js/client/). In Cycle.js you never use imperative calls (code with side-effects) directly, so cycle-deepstream wraps these calls into a driver with an API that uses [plain-javascript objects to define actions (actions.ts)](https://github.com/EnigmaCurry/cycle-deepstream/blob/master/src/actions.ts). 

There are [two examples](https://github.com/EnigmaCurry/cycle-deepstream/tree/master/examples) that show general usage. The [end-to-end test](https://github.com/EnigmaCurry/cycle-deepstream/blob/master/src/index.spec.ts) show comprehensive usage. 

Features
----------

Deepstream API Implementation:
  - Client
    - [x] login
    - [x] logout
    - events:
      - [x] onConnectionChange
      - [x] client.error
      - [x] login.success
      - [x] login.failure
      - [x] logout
  - Records:
    - [x] record.subscribe
       - Note: Only one subscription is supported per record, and no
         paths or callbacks are supported. Because the record
         subscription is broadcast to all driver listeners, only one
         subscription is ever needed. Subsequent record.subscribe
         requests for the same id are ignored unless you call
         record.discard first.
       - once subscribed, will emit events:
         - [x] record.change
         - [x] record.discard
         - [x] record.delete
         - [x] record.error
    - [x] record.set
    - [x] record.get
    - [x] record.snapshot
    - [x] record.discard
    - [x] record.delete
    - [x] record.listen
    - [ ] record.unsubscribe
      - Not implemented. Use record.discard instead.
    
  - Lists:
    - [x] list.subscribe
       - Note: Only one subscription is supported per list, and no
         paths or callbacks are supported. Because the list
         subscription is broadcast to all driver listeners, only one
         subscription is ever needed. Subsequent list.subscribe
         requests for the same id are ignored unless you call
         list.discard first.
      - once subscribed, will emit events:
         - [x] list.change
         - [x] list.entry-existing
           - This emits individual events for each existing entry, like list.entry-added.
           - Note, this is a driver level event, not a part of the Deepstream API.
         - [x] list.discard
         - [x] list.delete
         - [x] list.error
         - [x] list.entry-added
         - [x] list.entry-moved
         - [x] list.entry-removed
    - [x] list.getEntries
    - [x] list.setEntries
    - [x] list.addEntry
    - [x] list.removeEntry
    - [x] list.discard
    - [x] list.delete
    - [ ] list.unsubscribe
      - Not implemented. Use list.discard instead.
    
    
  - Events:
    - [x] event.subscribe
    - [x] event.unsubscribe
    - [x] event.emit
    - [x] event.listen
    - [x] event.unlisten
    
  - Presence:
    - [x] presence.subscribe
    - [x] presence.unsubscribe
    - [x] presence.getAll
    
  - RPC:
    - [x] rpc.make
    - [ ] rpc.provide - I think this makes no sense to implement in cycle?

