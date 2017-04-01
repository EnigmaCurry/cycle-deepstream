import { Driver } from '@cycle/run';
import { Stream } from 'xstream';
export declare type Intent = {
    action: string;
    name?: string;
};
export declare type LoginIntent = {
    action: string;
    name?: string;
    auth: Object;
};
export declare type SubscribeIntent = {
    action: string;
    name?: string;
    events: Object;
};
export declare type RecordSetIntent = {
    action: string;
    name?: string;
    data: Object;
    path?: string;
};
export declare type ListSetIntent = {
    action: string;
    name?: string;
    entries: Array<string>;
};
export declare type ListEntryIntent = {
    action: string;
    name?: string;
    entry: string;
    index: number;
};
export declare type ListenIntent = {
    action: string;
    name?: string;
    pattern: string;
};
export declare type RPCIntent = {
    action: string;
    method: string;
    data: Object;
};
export declare type Event = {
    event: string;
    name?: string;
    data?: any;
    entry?: string;
    position?: number;
    error?: string;
    state?: string;
    match?: string;
    isSubscribed?: boolean;
};
export declare function makeDeepstreamDriver({url, options, debug}: {
    url: string;
    options?: Object;
    debug?: boolean;
}): Driver<Stream<Intent>, Stream<Event>>;
