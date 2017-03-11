cycle-deepstream
=====================

[![Join the chat at https://gitter.im/EnigmaCurry/cycle-deepstream](https://badges.gitter.im/EnigmaCurry/cycle-deepstream.svg)](https://gitter.im/EnigmaCurry/cycle-deepstream?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A [Cycle.js](https://cycle.js.org/) driver for [deepstream.io](https://deepstream.io)

Status: *experimental* - not released on npm yet.

![giphy](https://cloud.githubusercontent.com/assets/43061/23532850/f8351d38-ff7b-11e6-9645-905309d7ee05.gif)

Run Demo
----------

    git clone https://github.com/EnigmaCurry/cycle-deepstream.git
    cd cycle-deepstream
    npm install
    cd examples/simple
    npm install
    npm run start

Features
----------

Deepstream API Implementation:
  - Records:
    - [x] record.subscribe
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
      - Not implemented. Would need to specify an id to subscribe() and 
        then pass the same id on unsubscribe, in order to track the callback.
    
  - Lists:
    - [x] list.subscribe
      - once subscribed, will emit events:
         - [x] list.change
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
    - [x] list.unsubscribe
    
    
  - Events:
    - [ ] event.subscribe
    - [ ] event.unsubscribe
    - [ ] event.emit
    - [ ] event.listen
    
  - Presence:
    - [ ] presence.subscribe
    - [ ] presence.unsubscribe
    - [ ] presence.getAll
    
  - RPC:
    - [ ] rpc.make
    - [ ] rpc.provide - I think this makes no sense to implement in cycle?

TODO
-----

 [ ] - Testing... lol.
