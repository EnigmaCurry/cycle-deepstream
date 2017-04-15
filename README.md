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

No formal docs exist for this yet. This driver implements most of the [deepstream API methods](https://deepstream.io/docs/client-js/client/). In Cycle.js you never use imperative calls directly (code with side-effects), so cycle-deepstream wraps these calls into a driver with an API that uses [plain-javascript objects to define actions (actions.ts)](https://github.com/EnigmaCurry/cycle-deepstream/blob/master/src/actions.ts).

For instance, calling record.subscribe returns an object that just describes what action to perform:

    > const actions = require('cycle-deepstream/dist/actions')
    > actions.record.subscribe('some-record')
    { action: 'record.subscribe',
      name: 'some-record',
      events: {},
      scope: undefined }

This action describes the appropriate deepstream API method to call and some additional arguments. In this case they are:

 * action - the deepstream API method name
 * name - the name of the deepstream record to subscribe to
 * events - the names of the [record events](https://deepstream.io/docs/client-js/datasync-record/#events) that we wish to subscribe to. The default is to subscribe to all of them, eg: ```{'record.existing': true, 'record.change': true, 'record.discard': true, 'record.delete': true, 'record.error': true }```. 
 * scope - this is a common argument to all of the methods, it specifies a particular ID to the request that is also applied to the response. This allows your code to know whether a particular event is due to your actions by filtering the event stream on this same ID. If no scope is defined, a default scope is used that is shared amongst all other requests that also don't use a scope. This mostly affects record.discard, as this will only discard the subscription of the record with the same scope defined.

This plain object is sent to the driver in it's input stream and processed by the driver asynchronously. When a deepstream event comes from the server, the driver passes this information to the output stream and back into your cycle application. Events of this sort look like this:

    { event: 'record.change',
      name: 'some-record',
      data: {
        foo: 'bar'
      },
      scope: undefined }

This event is the first response to our subscribe action above, consisting of the data of the existing content of the 'some-record' object in deepstream's database. Subseqent events would be more 'record.change' events or possibly 'record.delete' etc.

There's a helper function to apply scopes to actions:

    > const actions = require('cycle-deepstream/dist/actions')
    > const scope = actions.scope()
    > scope(actions.record.get('some-record'))
    { action: 'record.get',
      name: 'some-record',
      scope: 'j1jlj39z5ue7chjjdi4g' }    /* A randomly generated scope ID */
    > scope.scope   /* The scope ID is available on the object, even though it's a function */
    'j1jlj39z5ue7chjjdi4g'


The events you receive for the record will now have the scope `j1jlj39z5ue7chjjdi4g` applied to them so that you can filter on it in your own code.

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
      - once subscribed, will emit events:
         - [x] list.change
         - [x] list.entry-existing
           - This emits individual events, like list.entry-added, but for each existing entry in the list.
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

