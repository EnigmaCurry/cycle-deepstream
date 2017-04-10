import { Driver } from '@cycle/run'
import { Stream } from 'xstream'

export interface Intent {
  action: string,
  name?: string,
  scope?: string
}

export interface LoginIntent extends Intent {
  auth: Object
}

export interface SubscribeIntent extends Intent {
  events: Object
}

export interface RecordSetIntent extends Intent {
  data: Object,
  path?: string,
  acknowledge?: boolean
}

export interface ListSetIntent extends Intent {
  entries: Array<string>
}

export interface ListEntryIntent extends Intent {
  entry: string,
  index: number
}

export interface ListenIntent extends Intent {
  pattern: string
}

export interface EventEmitIntent extends Intent {
  data: any
}

export interface EventListenIntent extends Intent {
  pattern: string
}

export interface RPCIntent extends Intent {
  method: string,
  data: Object
}

export type Event = {
  event: string,
  name?: string,
  scope?: string,
  data?: any,
  entry?: string,
  position?: number,
  error?: string,
  state?: string,
  match?: string,
  isSubscribed?: boolean,
  clients?: Array<string>,
  username?: string,
  isLoggedIn?: boolean
}

export type CycleDeepstream = Driver<Stream<Intent>, Stream<Event>>

export interface ScopeFunction extends Function {
  scope?: string
}
