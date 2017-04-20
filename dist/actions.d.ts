import * as types from './types';
export declare function login(auth?: Object): {
    action: string;
    auth: Object;
};
export declare function logout(): {
    action: string;
};
export declare const record: {
    subscribe: (record: string, events?: {}, scope?: string) => {
        action: string;
        name: string;
        events: {};
        scope: string;
    };
    snapshot: (record: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    get: (record: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    set: (record: string, data: Object, acknowledge?: boolean, scope?: string) => {
        action: string;
        name: string;
        data: Object;
        acknowledge: boolean;
        scope: string;
    };
    setPath: (record: string, path: string, data: Object, acknowledge?: boolean, scope?: string) => {
        action: string;
        name: string;
        path: string;
        data: Object;
        acknowledge: boolean;
        scope: string;
    };
    discard: (record: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    delete: (record: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    listen: (pattern: string, scope?: string) => {
        action: string;
        pattern: string;
        scope: string;
    };
};
export declare const list: {
    subscribe: (list: string, events?: {}, scope?: string) => {
        action: string;
        name: string;
        events: {};
    };
    getEntries: (list: string, scope?: string) => {
        action: string;
        name: string;
    };
    setEntries: (list: string, entries: any[], scope?: string) => {
        action: string;
        name: string;
        entries: any[];
    };
    addEntry: (list: string, entry: string, index?: number, scope?: string) => {
        action: string;
        name: string;
        entry: string;
        index: number;
    };
    removeEntry: (list: string, entry: string, scope?: string) => {
        action: string;
        name: string;
        entry: string;
    };
    discard: (list: string, scope?: string) => {
        action: string;
        name: string;
    };
    delete: (list: string, scope?: string) => {
        action: string;
        name: string;
    };
};
export declare const rpc: {
    make: (method: string, data: Object, scope?: string) => {
        action: string;
        method: string;
        data: Object;
        scope: string;
    };
};
export declare const event: {
    subscribe: (event: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    unsubscribe: (event: string, scope?: string) => {
        action: string;
        name: string;
        scope: string;
    };
    emit: (name: string, data: any, scope?: string) => {
        action: string;
        name: string;
        data: any;
        scope: string;
    };
    listen: (pattern: string, scope?: string) => {
        action: string;
        pattern: string;
        scope: string;
    };
    unlisten: (pattern: string, scope?: string) => {
        action: string;
        pattern: string;
        scope: string;
    };
};
export declare const presence: {
    subscribe: (scope?: string) => {
        action: string;
        scope: string;
    };
    unsubscribe: (scope?: string) => {
        action: string;
        scope: string;
    };
    getAll: (scope?: string) => {
        action: string;
        scope: string;
    };
};
export declare const scope: (scope?: string) => types.ScopeFunction;
