import { Stream } from 'xstream'
import { DOMSource, VNode } from '@cycle/dom/lib'
import { HistoryInput } from '@cycle/history/lib'

// Sources that all components receive:
export type Sources = {
  DOM: DOMSource,
  history$: Stream<HistoryInput>,
  deep$: Stream<any>
}

// Sink types for all sub containers/components:
export type Sinks = {
  DOM?: Stream<VNode>,
  deep$?: Stream<any>,
  history$?: Stream<HistoryInput>
}

export type MainSources = {
  DOM: DOMSource,
  history$: Stream<HistoryInput>,
  deep$: Stream<any>,
  header$: DOMSource,
  drawer$: DOMSource,
}

// Sink type for the main application
export type MainSinks = {
  DOM: Stream<VNode>,
  deep$: Stream<any>,
  history$: Stream<HistoryInput>,
  header$: Stream<VNode>,
  drawer$: Stream<VNode>
}

export type Route = {
  container: (sources: Sources) => Sinks,
  pattern: string
}


