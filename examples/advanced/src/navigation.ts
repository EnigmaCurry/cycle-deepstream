// This wraps the HistoryInput types from @cycle/history This is done
// because of weirdness with typescript, and I'd rather not have to
// use typecasting each time I want to update navigation.
//See this for more details:
// https://github.com/cyclejs/cyclejs/blob/3f24624d6123130bbf619717de4403a75ea40620/history/src/types.ts#L9-L15

import {
  PushHistoryInput, ReplaceHistoryInput,
  GoHistoryInput, GoBackHistoryInput,
  GoForwardHistoryInput
} from '@cycle/history/lib'

export function push(pathname: string): PushHistoryInput {
  return <PushHistoryInput>{ type: 'push', pathname }
}
export function replace(pathname: string): ReplaceHistoryInput {
  return <ReplaceHistoryInput>{ type: 'replace', pathname }
}
export function go(amount: number): GoHistoryInput {
  return <GoHistoryInput>{ type: 'go', amount }
}
export function goBack(pathname: string): GoBackHistoryInput {
  return <GoBackHistoryInput>{ type: 'goBack' }
}
export function goForward(pathname: string): GoForwardHistoryInput {
  return <GoForwardHistoryInput>{ type: 'goForward' }
}
