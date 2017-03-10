import { Stream } from 'xstream'
import { DOMSource, VNode } from '@cycle/dom/lib'
import { HistoryInput } from '@cycle/history/lib'

export type Sources = {
  DOM: DOMSource,
  history$: Stream<HistoryInput>,
  deep$: Stream<any>
}

export type Sinks = {
  DOM: Stream<VNode>,
  history$: Stream<HistoryInput>,
  deep$: Stream<any>
}

export type Route = {
  container: (sources: Sources) => Sinks,
  pattern: string
}


