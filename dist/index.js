"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var deepstream = require("deepstream.io-client-js");
var events_1 = require("events");
function makeDeepstreamDriver(_a) {
    var url = _a.url, _b = _a.options, options = _b === void 0 ? {} : _b, _c = _a.debug, debug = _c === void 0 ? false : _c;
    return function deepstreamDriver(action$) {
        var client;
        var cachedRecords = {};
        var cachedLists = {};
        // Internal event emitter to delegate between action 
        var events = new events_1.EventEmitter();
        var emit = function (data) {
            logEvent(data);
            events.emit('deepstream-event', data);
        };
        function logAction() {
            var msgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                msgs[_i] = arguments[_i];
            }
            if (debug)
                console.debug.apply(null, ['deepstream action:'].concat(msgs));
        }
        function logEvent(event) {
            if (event['error'] !== undefined) {
                console.error('deepstream error:', JSON.stringify(event));
            }
            else if (debug) {
                console.debug('deepstream event:', JSON.stringify(event));
            }
        }
        function getRecord(name) {
            return new Promise(function (resolve, reject) {
                var record = cachedRecords[name] === undefined ?
                    client.record.getRecord(name) : cachedRecords[name];
                record.on('error', function (err) { return reject(err); });
                record.whenReady(function (record) {
                    cachedRecords[name] = record;
                    resolve(record);
                });
            });
        }
        function getList(name) {
            return new Promise(function (resolve, reject) {
                var list = cachedLists[name] === undefined ?
                    client.record.getList(name) : cachedLists[name];
                list.on('error', function (err) { return reject(err); });
                list.whenReady(function (list) {
                    cachedLists[name] = list;
                    resolve(list);
                });
            });
        }
        var login$ = action$.filter(function (intent) { return intent.action === 'login'; });
        var loginListener = login$.addListener({
            next: function (intent) {
                logAction(intent.action, '(auth details hidden)');
                if (client !== undefined) {
                    client.close();
                }
                // Delete caches:
                cachedRecords = {};
                cachedLists = {};
                client = window.ds = deepstream(url, options).login(intent.auth, function (success, data) {
                    if (success) {
                        emit({ event: 'login.success', data: data });
                    }
                    else {
                        emit({ event: 'login.failure', data: data });
                    }
                });
                client.on('error', function (error) {
                    emit({ event: 'client.error', error: error });
                });
                client.on('connectionStateChanged', function (state) {
                    emit({ event: 'connection.state', state: state });
                });
            },
            error: function () { },
            complete: function () { }
        });
        var logout$ = action$.filter(function (intent) { return intent.action === 'logout'; });
        var logoutListener = logout$.addListener({
            next: function (intent) {
                logAction(intent.action);
                // Delete caches:
                cachedRecords = {};
                cachedLists = {};
                if (client !== undefined) {
                    client.close();
                }
                emit({ event: 'logout' });
            },
            error: function () { },
            complete: function () { }
        });
        var recordSubscription$ = action$.filter(function (intent) { return intent.action === 'record.subscribe'
            && intent.name !== undefined; });
        var recordSubscriptionListener = recordSubscription$.addListener({
            next: function (intent) {
                var events = Object.assign({
                    'record.change': true,
                    'record.discard': true,
                    'record.delete': true,
                    'record.error': true
                }, intent.events);
                logAction(intent.action, intent.name, intent.events ? JSON.stringify(intent.events) : '');
                getRecord(intent.name).then(function (record) {
                    if (events['record.change']) {
                        record.subscribe(function (data) {
                            emit({ event: 'record.change', name: record.name, data: data });
                        }, true);
                    }
                    if (events['record.discard']) {
                        record.on('discard', function () {
                            emit({ event: 'record.discard', name: record.name });
                        });
                    }
                    if (events['record.delete']) {
                        record.on('delete', function () {
                            emit({ event: 'record.delete', name: record.name });
                        });
                    }
                    if (events['record.error']) {
                        record.on('error', function (err) {
                            emit({ event: 'record.error', name: record.name, error: err });
                        });
                    }
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordGet$ = action$.filter(function (intent) { return intent.action === 'record.get'
            && intent.name !== undefined; });
        var recordGetListener = recordGet$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getRecord(intent.name).then(function (record) {
                    emit({ event: 'record.get', name: record.name, data: record });
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordSnapshot$ = action$.filter(function (intent) { return intent.action === 'record.snapshot'
            && intent.name !== undefined; });
        var recordSnapshotListener = recordSnapshot$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                client.record.snapshot(intent.name, function (error, record) {
                    emit({ event: 'record.snapshot', name: record.name, data: record });
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordSet$ = action$.filter(function (intent) { return intent.action === 'record.set'
            && intent.name !== undefined
            && intent.data !== undefined; });
        var recordSetListener = recordSet$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getRecord(intent.name).then(function (record) {
                    if (typeof intent.path === undefined) {
                        record.set(intent.data);
                    }
                    else {
                        record.set(intent.path, intent.data);
                    }
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordDelete$ = action$.filter(function (intent) { return intent.action === 'record.delete'
            && intent.name !== undefined; });
        var recordDeleteListener = recordDelete$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getRecord(intent.name).then(function (record) {
                    record.unsubscribe();
                    record.delete();
                    delete cachedRecords[record.name];
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordDiscard$ = action$.filter(function (intent) { return intent.action === 'record.discard'
            && intent.name !== undefined; });
        var recordDiscardListener = recordDiscard$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getRecord(intent.name).then(function (record) {
                    record.unsubscribe();
                    record.discard();
                    delete cachedRecords[record.name];
                });
            },
            error: function () { },
            complete: function () { }
        });
        var recordListen$ = action$.filter(function (intent) { return intent.action === 'record.listen'
            && intent.pattern !== undefined; });
        var recordListenListener = recordListen$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                client.record.listen(intent.pattern, function (match, isSubscribed, response) {
                    response.accept();
                    emit({ event: 'record.listen', match: match, isSubscribed: isSubscribed });
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listSubscription$ = action$.filter(function (intent) { return intent.action === 'list.subscribe'
            && intent.name !== undefined; });
        var listSubscriptionListener = listSubscription$.addListener({
            next: function (intent) {
                var events = Object.assign({
                    'list.change': true,
                    'list.entry-existing': true,
                    'list.discard': true,
                    'list.delete': true,
                    'list.error': true,
                    'list.entry-added': true,
                    'list.entry-moved': true,
                    'list.entry-removed': true
                }, intent.events);
                logAction(intent.action, intent.name, intent.events ? JSON.stringify(intent.events) : '');
                getList(intent.name).then(function (list) {
                    // Is this the first time the subscription callback is called?
                    var callbackFirstCall = true;
                    list.subscribe(function (data) {
                        if (events['list.change']) {
                            emit({ event: 'list.change', name: list.name, data: data });
                        }
                        // Only do this the *first* time the callback is called, on subscription:
                        if (events['list.entry-existing'] && callbackFirstCall) {
                            for (var i = 0; i < data.length; i++) {
                                emit({ event: 'list.entry-existing', name: list.name, entry: data[i], position: i });
                            }
                        }
                        callbackFirstCall = false;
                    }, true);
                    if (events['list.discard']) {
                        list.on('discard', function () {
                            emit({ event: 'list.discard', name: list.name });
                        });
                    }
                    if (events['list.delete']) {
                        list.on('delete', function () {
                            emit({ event: 'list.delete', name: list.name });
                        });
                    }
                    if (events['list.error']) {
                        list.on('error', function (err) {
                            emit({ event: 'list.error', name: list.name, error: err });
                        });
                    }
                    if (events['list.entry-added']) {
                        list.on('entry-added', function (entry, position) {
                            emit({ event: 'list.entry-added', name: list.name, entry: entry, position: position });
                        });
                    }
                    if (events['list.entry-moved']) {
                        list.on('entry-moved', function (entry, position) {
                            emit({ event: 'list.entry-moved', name: list.name, entry: entry, position: position });
                        });
                    }
                    if (events['list.entry-removed']) {
                        list.on('entry-removed', function (entry, position) {
                            emit({ event: 'list.entry-removed', name: list.name, entry: entry, position: position });
                        });
                    }
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listGetEntries$ = action$.filter(function (intent) { return intent.action === 'list.getEntries'
            && intent.name !== undefined; });
        var listGetEntriesListener = listGetEntries$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    emit({ event: 'list.getEntries', name: list.name, data: list.getEntries() });
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listSetEntries$ = action$.filter(function (intent) { return intent.action === 'list.setEntries'
            && intent.entries !== undefined
            && intent.name !== undefined; });
        var listSetEntriesListener = listSetEntries$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    list.setEntries(intent.entries);
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listAddEntry$ = action$.filter(function (intent) { return intent.action === 'list.addEntry'
            && intent.name !== undefined
            && intent.entry !== undefined; });
        var listAddEntryListener = listAddEntry$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    list.addEntry(intent.entry, intent.index);
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listRemoveEntry$ = action$.filter(function (intent) { return intent.action === 'list.removeEntry'
            && intent.name !== undefined
            && intent.entry !== undefined; });
        var listRemoveEntryListener = listRemoveEntry$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    list.removeEntry(intent.entry, intent.index);
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listDelete$ = action$.filter(function (intent) { return intent.action === 'list.delete'
            && intent.name !== undefined; });
        var listDeleteListener = listDelete$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    list.unsubscribe();
                    list.delete();
                    delete cachedLists[list.name];
                });
            },
            error: function () { },
            complete: function () { }
        });
        var listDiscard$ = action$.filter(function (intent) { return intent.action === 'list.discard'
            && intent.name !== undefined; });
        var listDiscardListener = listDiscard$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.name);
                getList(intent.name).then(function (list) {
                    list.unsubscribe();
                    list.discard();
                    delete cachedLists[list.name];
                });
            },
            error: function () { },
            complete: function () { }
        });
        var rpcMake$ = action$.filter(function (intent) { return intent.action === 'rpc.make'
            && intent.method !== undefined; });
        var rpcMakeListener = rpcMake$.addListener({
            next: function (intent) {
                logAction(intent.action, intent.method, JSON.stringify(intent.data));
                client.rpc.make(intent.method, intent.data, function (error, result) {
                    if (error) {
                        throw new Error(error);
                    }
                    // TODO how to link the rpc response to the original request? new ID?
                });
            },
            error: function () { },
            complete: function () { }
        });
        return xstream_1.default.create({
            start: function (listener) {
                events.on('deepstream-event', function (event) {
                    listener.next(event);
                });
            },
            stop: function () { }
        });
    };
}
exports.makeDeepstreamDriver = makeDeepstreamDriver;
//# sourceMappingURL=index.js.map