import { Stream } from 'xstream'
import { DOMSource, VNode } from '@cycle/dom/lib'
import { HistoryInput } from '@cycle/history/lib'

export type Sources = {
  DOM: DOMSource,
  history$: Stream<HistoryInput>
}

export type Sinks = {
  DOM: Stream<VNode>,
  history$: Stream<HistoryInput>
}

export type Route = {
  container: (sources: Sources) => Sinks,
  pattern: string
}

