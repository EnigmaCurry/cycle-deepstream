"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function login(auth) {
    return { action: 'login', auth };
}
exports.login = login;
function logout() {
    return { action: 'logout' };
}
exports.logout = logout;
exports.record = {
    subscribe: (record, events = {}, scope) => ({ action: 'record.subscribe', name: record, events, scope }),
    snapshot: (record, scope) => ({ action: 'record.snapshot', name: record, scope }),
    get: (record, scope) => ({ action: 'record.get', name: record, scope }),
    set: (record, data, acknowledge, scope) => ({ action: 'record.set', name: record, data, acknowledge, scope }),
    setPath: (record, path, data, acknowledge, scope) => ({ action: 'record.set', name: record, path, data, acknowledge, scope }),
    discard: (record, scope) => ({ action: 'record.discard', name: record, scope }),
    delete: (record, scope) => ({ action: 'record.delete', name: record, scope }),
    listen: (pattern, scope) => ({ action: 'record.listen', pattern, scope })
};
exports.list = {
    subscribe: (list, events = {}, scope) => ({ action: 'list.subscribe', name: list, events, scope }),
    getEntries: (list, scope) => ({ action: 'list.getEntries', name: list, scope }),
    setEntries: (list, entries, scope) => ({ action: 'list.setEntries', name: list, entries, scope }),
    addEntry: (list, entry, index, scope) => ({ action: 'list.addEntry', name: list, entry, index, scope }),
    removeEntry: (list, entry, scope) => ({ action: 'list.removeEntry', name: list, entry, scope }),
    discard: (list, scope) => ({ action: 'list.discard', name: list, scope }),
    delete: (list, scope) => ({ action: 'list.delete', name: list, scope })
};
exports.rpc = {
    make: (method, data, scope) => ({ action: 'rpc.make', method: method, data, scope })
};
exports.event = {
    subscribe: (event, scope) => ({ action: 'event.subscribe', name: event, scope }),
    unsubscribe: (event, scope) => ({ action: 'event.unsubscribe', name: event, scope }),
    emit: (name, data, scope) => ({ action: 'event.emit', name, data, scope }),
    listen: (pattern, scope) => ({ action: 'event.listen', pattern, scope }),
    unlisten: (pattern, scope) => ({ action: 'event.unlisten', pattern, scope })
};
exports.presence = {
    subscribe: (scope) => ({ action: 'presence.subscribe', scope }),
    unsubscribe: (scope) => ({ action: 'presence.unsubscribe', scope }),
    getAll: (scope) => ({ action: 'presence.getAll', scope })
};
exports.scope = (scope) => {
    if (typeof scope === 'undefined') {
        scope = (new Date()).getTime().toString(36) + (Math.random() * 1E18).toString(36);
    }
    const func = (data) => {
        return Object.assign({}, data, { scope });
    };
    func.scope = scope;
    return func;
};
//# sourceMappingURL=actions.js.map