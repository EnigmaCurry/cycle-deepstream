import xs from 'xstream'
import { h, div, br, span, a, button, input } from '@cycle/dom'
import { PushHistoryInput } from '@cycle/history/lib'
import * as deepstream from '../actions/deepstream'
import { Sources, Sinks } from '../types'

function view(userData) {

  const randomGreeting = (name) => {
    const greetings = [
      `Ask me why, ${name}?`,
      `Love me do, ${name}.`,
      `Stop my mind from wandering, ${name}!`,
      `A four of fish and finger pies.`,
      `${name}, don't you know? We all live in a yello submarine!`,
      `Where do they all belong, ${name}?`,
      `${name} got the bill and Rita paid it.`,
      `${name}, let it be, let it be.`,
      `Alright, alright, ${name}`,
      `${name}, don't you know the latest dance?`,
      `It's the next best thing to be, ${name}, free as a bird.`,
      `${name}, feeling two foot small. You've got to hide your love away.`,
      `${name}, I read the news today, oh boy!`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  if (userData) {
    return div([
      h('h3', randomGreeting(userData.name))
    ])
  } else {
    return div('')
  }
}

export function Home(sources: Sources): Sinks {
  const { DOM, history$, deep$ } = sources

  const loginState$ = xs.merge(
    deep$
      .filter(effect => effect.event === 'logout' || effect.event === 'login.failure')
      .mapTo(null),
    deep$
      .filter(effect => effect.event === 'login.success')
      .map(effect => effect.data))
    .startWith(null)

  const logout$ = DOM
    .select('.logout')
    .events('click')
    .map(ev => deepstream.logout())

  const vdom$ = loginState$
    .map(userData => view(userData))

  const navigation$ = xs.never()

  return {
    DOM: vdom$,
    history$: navigation$,
    deep$: logout$
  }
}
