"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fromEvent_1 = require("xstream/extra/fromEvent");
const deepstream = require("deepstream.io-client-js");
const chai = require("chai");
const index_1 = require("./index");
const actions = require("./actions");
const events_1 = require("events");
const expect = chai.expect;
const Deepstream = require('deepstream.io');
const portastic = require('portastic');
const consumeStream = (stream) => {
    const values = [];
    return new Promise((resolve, reject) => {
        stream.addListener({
            next: i => {
                //console.warn('Consumed stream value:', i)
                values.push(i);
            },
            complete: () => resolve(values),
            error: err => reject(err)
        });
    });
};
const expectStreamValues = (stream, expected) => {
    return new Promise((resolve, reject) => {
        consumeStream(stream).then(values => {
            //console.log('Completed stream values:', values)
            expect(values).to.deep.equal(expected);
            resolve();
        }).catch(err => reject(err));
    });
};
describe('cycle-deepstream', () => {
    let server, url, client;
    // action$ is requests sent to deepstream emitted as events in each test
    // deep$ is events coming from deepstream
    const events = new events_1.EventEmitter();
    const action$ = fromEvent_1.default(events, 'action');
    let deep$;
    const emitAction = (action) => {
        events.emit('action', action);
    };
    before('start deepstream server', next => {
        portastic.find({ min: 6020, max: 6030 }).then((ports) => {
            url = `localhost:${ports[0]}`;
            server = new Deepstream({ port: ports[0] });
            server.on('started', () => {
                expect(server.isRunning()).to.be.true;
                deep$ = index_1.makeDeepstreamDriver({ url, options: { maxReconnectAttempts: 0 }, debug: true })(action$);
                //Secondary client we use to interact directly with deepstream
                client = deepstream(url).login();
                //Provide an rpc for tests to call:
                client.rpc.provide('rot13', (data, response) => {
                    response.send(data.replace(/[A-Za-z]/g, (c) => {
                        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".charAt("NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm".indexOf(c));
                    }));
                });
                next();
            });
            server.start();
        });
    });
    it('must login to deepstream', next => {
        const login$ = deep$
            .filter(evt => evt.event === 'login.success')
            .take(1);
        expectStreamValues(login$, [{ event: 'login.success', data: null }])
            .then(next)
            .catch(next);
        emitAction(actions.login());
    });
    ////////////////////////////////////////
    // Records
    ////////////////////////////////////////
    it('must subscribe to records', next => {
        const subscribe$ = deep$
            .filter(evt => evt.event === 'record.change')
            .take(6);
        expectStreamValues(subscribe$, [
            { event: 'record.change', name: 'recordToModify', data: {} },
            { event: 'record.change', name: 'recordToDiscard', data: {} },
            { event: 'record.change', name: 'recordToDelete', data: {} },
            { event: 'record.change', name: 'listitem1', data: {} },
            { event: 'record.change', name: 'listitem2', data: {} },
            { event: 'record.change', name: 'listitem3', data: {} }
        ])
            .then(next)
            .catch(next);
        emitAction(actions.record.subscribe('recordToModify'));
        emitAction(actions.record.subscribe('recordToDiscard'));
        emitAction(actions.record.subscribe('recordToDelete'));
        emitAction(actions.record.subscribe('listitem1'));
        emitAction(actions.record.subscribe('listitem2'));
        emitAction(actions.record.subscribe('listitem3'));
    });
    it('must respond to changing records', next => {
        const recordChange$ = deep$
            .filter(evt => evt.event === 'record.change')
            .take(3);
        expectStreamValues(recordChange$, [
            { event: 'record.change', name: 'recordToModify', data: { foo: 'bar' } },
            { event: 'record.change', name: 'recordToModify', data: { foo: 'bar', thing: 'fling' } },
            { event: 'record.change', name: 'recordToModify', data: { foo: 'bar', thing: 3 } },
        ]).then(next)
            .catch(next);
        //Modify the record to fire record.change:
        client.record.getRecord('recordToModify').whenReady((record) => {
            record.set({ foo: 'bar' });
            record.set('thing', 'fling');
            record.set('thing', 3);
        });
    });
    it('must set records with record.set', next => {
        const recordSet$ = deep$
            .filter(evt => evt.event === 'record.set')
            .take(2);
        expectStreamValues(recordSet$, [
            // Four set actions are performed, only two have write acknowledgement:
            { event: 'record.set', name: 'recordToModify' },
            { event: 'record.set', name: 'recordToModify' }
        ]).then(next)
            .catch(next);
        //Set without write acknowledgement
        emitAction(actions.record.set('recordToModify', { foo: 'somethingelse' }));
        //Set with write acknowledgement
        emitAction(actions.record.set('recordToModify', { foo: 'bar2' }, true));
        //Set with path without write acknowledgement
        emitAction(actions.record.setPath('recordToModify', 'foo', 'somethingelse2'));
        //Set with path and write acknowledgement
        emitAction(actions.record.setPath('recordToModify', 'foo', 'bar', true));
    });
    it('must retrieve records with record.get', next => {
        const recordGet$ = deep$
            .filter(evt => evt.event === 'record.get')
            .take(1);
        expectStreamValues(recordGet$, [{ event: 'record.get', name: 'recordToModify', data: { foo: 'bar' } }])
            .then(next)
            .catch(next);
        emitAction(actions.record.get('recordToModify'));
    });
    it('must return the same scope in the response if given in the action', next => {
        const explicitScope = actions.scope('Explicit scope for this test');
        const implicitScope = actions.scope();
        const recordGet$ = deep$
            .filter(evt => evt.event === 'record.get')
            .take(2);
        expectStreamValues(recordGet$, [
            {
                event: 'record.get', name: 'recordToModify',
                data: { foo: 'bar' }, scope: explicitScope.scope
            },
            {
                event: 'record.get', name: 'recordToModify',
                data: { foo: 'bar' }, scope: implicitScope.scope
            }
        ])
            .then(next)
            .catch(next);
        emitAction(explicitScope(actions.record.get('recordToModify')));
        emitAction(implicitScope(actions.record.get('recordToModify')));
    });
    it('must retrieve records with record.snapshot', next => {
        const recordSnapshot$ = deep$
            .filter(evt => evt.event === 'record.snapshot')
            .take(1);
        expectStreamValues(recordSnapshot$, [{ event: 'record.snapshot', name: 'recordToModify', data: { foo: 'bar' } }])
            .then(next)
            .catch(next);
        emitAction(actions.record.snapshot('recordToModify'));
    });
    it('must respond to discarding records', next => {
        const recordDiscard$ = deep$
            .filter(evt => evt.event === 'record.discard')
            .take(1);
        expectStreamValues(recordDiscard$, [{ event: 'record.discard', name: 'recordToDiscard' }])
            .then(next)
            .catch(next);
        emitAction(actions.record.discard('recordToDiscard'));
    });
    it('must respond to deleting records', next => {
        const recordDelete$ = deep$
            .filter(evt => evt.event === 'record.delete')
            .take(1);
        expectStreamValues(recordDelete$, [{ event: 'record.delete', name: 'recordToDelete' }])
            .then(next)
            .catch(next);
        emitAction(actions.record.delete('recordToDelete'));
    });
    it('must respond to record listening', next => {
        const recordListen$ = deep$
            .filter(evt => evt.event === 'record.listen')
            .take(2);
        expectStreamValues(recordListen$, [
            { event: 'record.listen', match: 'listen1', isSubscribed: true },
            { event: 'record.listen', match: 'listen1', isSubscribed: false }
        ])
            .then(next)
            .catch(next);
        emitAction(actions.record.listen('listen1'));
        // Get the record with the other client, to trigger the listen callback:
        client.record.getRecord('listen1').whenReady(record => {
            record.discard();
        });
    });
    ////////////////////////////////////////
    // Logout / Re-Login
    ////////////////////////////////////////
    it('must logout from deepstream', next => {
        const logout$ = deep$
            .filter(evt => evt.event === 'logout')
            .take(1);
        expectStreamValues(logout$, [{ event: 'logout' }])
            .then(next)
            .catch(next);
        emitAction(actions.logout());
    });
    it('must support login again after logout', next => {
        const login$ = deep$
            .filter(evt => evt.event === 'login.success')
            .take(1);
        expectStreamValues(login$, [{ event: 'login.success', data: null }])
            .then(next)
            .catch(next);
        emitAction(actions.login());
    });
    ////////////////////////////////////////
    // Lists
    ////////////////////////////////////////
    it('must subscribe to lists', next => {
        const subscribe$ = deep$
            .filter(evt => evt.event === 'list.change')
            .take(1);
        expectStreamValues(subscribe$, [{ event: 'list.change', name: 'list1', data: [] }])
            .then(next)
            .catch(next);
        emitAction(actions.list.subscribe('list1'));
    });
    it('must respond to adding things to a list', next => {
        const expected = [
            { event: 'list.entry-added', name: 'list1', entry: 'listitem1', position: 0 },
            { event: 'list.entry-added', name: 'list1', entry: 'listitem2', position: 1 },
            { event: 'list.entry-added', name: 'list1', entry: 'listitem3', position: 2 },
            { event: 'list.entry-added', name: 'list1', entry: 'listitem4', position: 3 }
        ];
        const listEntryAdded$ = deep$
            .filter(evt => evt.event === 'list.entry-added')
            .take(expected.length);
        expectStreamValues(listEntryAdded$, expected)
            .then(next)
            .catch(next);
        emitAction(actions.list.addEntry('list1', 'listitem1'));
        emitAction(actions.list.addEntry('list1', 'listitem2'));
        emitAction(actions.list.addEntry('list1', 'listitem3'));
        emitAction(actions.list.addEntry('list1', 'listitem4'));
    });
    it('must respond to removing things in a list', next => {
        const listEntryRemoved$ = deep$
            .filter(evt => evt.event === 'list.entry-removed')
            .take(1);
        expectStreamValues(listEntryRemoved$, [
            { event: 'list.entry-removed', name: 'list1', entry: 'listitem1', position: 0 }
        ]).then(next)
            .catch(next);
        emitAction(actions.list.removeEntry('list1', 'listitem1'));
    });
    it('must get list entries', next => {
        const listGetEntries$ = deep$
            .filter(evt => evt.event === 'list.getEntries')
            .take(1);
        expectStreamValues(listGetEntries$, [
            { event: 'list.getEntries', name: 'list1', data: ['listitem2', 'listitem3', 'listitem4'] }
        ]).then(next)
            .catch(next);
        emitAction(actions.list.getEntries('list1'));
    });
    it('must set list entries', next => {
        const listSetEntries$ = deep$
            .filter(evt => evt.event === 'list.change')
            .take(1);
        expectStreamValues(listSetEntries$, [
            { event: 'list.change', name: 'list1', data: ['listitem1', 'listitem2'] }
        ]).then(next)
            .catch(next);
        emitAction(actions.list.setEntries('list1', ['listitem1', 'listitem2']));
    });
    it('must get existing list entries on new subscribe', next => {
        const subscribe$ = deep$
            .filter(evt => evt.event === 'list.entry-existing')
            .take(2);
        expectStreamValues(subscribe$, [
            { event: 'list.entry-existing', name: 'list1', entry: 'listitem1', position: 0 },
            { event: 'list.entry-existing', name: 'list1', entry: 'listitem2', position: 1 }
        ])
            .then(next)
            .catch(next);
        emitAction(actions.list.subscribe('list1'));
    });
    it('must respond to discarding lists', next => {
        const listDiscard$ = deep$
            .filter(evt => evt.event === 'list.discard')
            .take(1);
        expectStreamValues(listDiscard$, [{ event: 'list.discard', name: 'list1' }])
            .then(next)
            .catch(next);
        emitAction(actions.list.discard('list1'));
    });
    it('must respond to deleting a list', next => {
        const subscribe$ = deep$
            .filter(evt => evt.event === 'list.entry-existing')
            .take(2);
        expectStreamValues(subscribe$, [
            { event: 'list.entry-existing', name: 'list1', entry: 'listitem1', position: 0 },
            { event: 'list.entry-existing', name: 'list1', entry: 'listitem2', position: 1 }
        ]).catch(next);
        const delete$ = deep$
            .filter(evt => evt.event === 'list.delete')
            .take(1);
        expectStreamValues(delete$, [{ event: 'list.delete', name: 'list1' }])
            .then(next).catch(next);
        emitAction(actions.list.subscribe('list1'));
        emitAction(actions.list.delete('list1'));
    });
    ////////////////////////////////////////
    // RPC
    ////////////////////////////////////////
    it('must respond to making rpc calls', next => {
        const scope = actions.scope('rpc test');
        const rpc$ = deep$
            .filter(evt => evt.event === 'rpc.response' && evt.scope === 'rpc test')
            .take(1);
        expectStreamValues(rpc$, [
            { event: 'rpc.response', data: 'abg-fb-frperg', scope: 'rpc test' }
        ]).then(next).catch(next);
        emitAction(scope(actions.rpc.make('rot13', 'not-so-secret')));
    });
    ////////////////////////////////////////
    // Events
    ////////////////////////////////////////
    it('must subscribe and unsubscribe to events', next => {
        const subscribe$ = deep$
            .filter(evt => evt.event === 'event.emit')
            .take(1);
        const event = { event: 'event.emit', name: 'test-event', data: { foo: 'bar' } };
        expectStreamValues(subscribe$, [event]).then(() => {
            emitAction(actions.event.unsubscribe('test-event'));
            next();
        }).catch(next);
        emitAction(actions.event.subscribe('test-event'));
        //Fire the event with our other client:
        client.event.emit('test-event', event);
    });
    it('must emit events', next => {
        client.event.subscribe('test-event2', data => {
            expect(data).to.deep.equal({ foo: 'bar' });
            next();
        });
        emitAction(actions.event.emit('test-event2', { foo: 'bar' }));
    });
    it('must listen and unlisten to event subscriptions', next => {
        const listen$ = deep$
            .filter(evt => evt.event === 'event.listen')
            .take(2);
        expectStreamValues(listen$, [
            { event: 'event.listen', match: 'test-event2', isSubscribed: true },
            { event: 'event.listen', match: 'test-event2', isSubscribed: false }
        ]).then(() => {
            emitAction(actions.event.unlisten('test-event2'));
            next();
        }).catch(next);
        emitAction(actions.event.listen('test-event2'));
        setTimeout(() => {
            client.event.unsubscribe('test-event2', undefined);
        }, 300);
    });
    ////////////////////////////////////////
    // Presence
    ////////////////////////////////////////
    it('must allow subscribing and unsubscribing to presence events', next => {
        const scope = 'test-presence';
        const presence$ = deep$
            .filter(evt => evt.event === 'presence.event')
            .take(2);
        expectStreamValues(presence$, [
            { event: 'presence.event', username: 'bob', isLoggedIn: true, scope },
            { event: 'presence.event', username: 'bob', isLoggedIn: false, scope }
        ]).then(() => {
            emitAction(actions.presence.unsubscribe(scope));
            next();
        }).catch(next);
        emitAction(actions.presence.subscribe(scope));
        //Login as bob:
        const tempClient = deepstream(url);
        tempClient.on('connectionStateChanged', (state) => {
            if (state === 'OPEN') {
                tempClient.close();
            }
        });
        tempClient.login({ username: 'bob' });
    });
    it('must allow getting all connected clients with presence.getAll', next => {
        const presence$ = deep$
            .filter(evt => evt.event === 'presence.getAll')
            .take(1);
        expectStreamValues(presence$, [
            { event: 'presence.getAll', clients: ['jean-luc'] }
        ]).then(next).catch(next);
        const tempClient = deepstream(url);
        tempClient.on('connectionStateChanged', (state) => {
            if (state === 'OPEN') {
                emitAction(actions.presence.getAll());
            }
        });
        tempClient.login({ username: 'jean-luc' });
    });
});
//# sourceMappingURL=index.spec.js.map