import type { Dep } from './dep'

let activeEffect: ReactiveEffect | undefined
export class ReactiveEffect<T = any> {
  private _fn: () => T
  constructor(public fn: () => T) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    this._fn()
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export function track(target: object, key: unknown) {
  let depsMap = targetMap.get(target)
  if (!depsMap)
    targetMap.set(target, (depsMap = new Map()))

  let dep = depsMap.get(key)
  if (!dep)
    depsMap.set(key, (dep = new Set()))

  trackEffects(dep)
}

export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

export function trigger(target: object, key?: unknown) {
  const depsMap = targetMap.get(target)
  if (!depsMap)
    return
  const dep = depsMap.get(key)!

  triggerEffects(dep)
}

export function triggerEffects(dep: Dep | ReactiveEffect[]) {
  for (const effect of dep)
    effect.run()
}
