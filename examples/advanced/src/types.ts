import { Stream } from 'xstream'
import { DOMSource, VNode } from '@cycle/dom/lib'
import { HistoryInput } from '@cycle/history/lib'

export type Sources = {
  DOM: DOMSource,
  header$: DOMSource,
  drawer$: DOMSource,
  history$: Stream<HistoryInput>,
  deep$: Stream<any>
}

export type Sinks = {
  DOM: Stream<VNode>,
  deep$: Stream<any>,
  history$: Stream<HistoryInput>,
  header$?: Stream<VNode>,
  drawer$?: Stream<VNode>,
}

export type Route = {
  container: (sources: Sources) => Sinks,
  pattern: string
}


