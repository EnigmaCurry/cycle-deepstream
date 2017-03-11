import xs from 'xstream'
import { adapt } from '@cycle/run/lib/adapt'

export function makeTitleDriver(titleElement: HTMLElement, baseTitle = '') {
  return function titleDriver(title$) {
    title$.addListener({
      next: title => {
        titleElement.innerText = `${baseTitle}${title}`
      }
    })
    return xs.never()
  }
}
