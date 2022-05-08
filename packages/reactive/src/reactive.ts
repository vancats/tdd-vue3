import { hasOwn, isObject } from '@vancats/shared'
import { track, trigger } from './effect'
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  const proxy = new Proxy(raw, {
    get(target, key) {
      if (key === ReactiveFlags.IS_REACTIVE)
        return true

      const res = Reflect.get(target, key)
      if (isObject(res))
        return reactive(res)

      track(target, key)
      return res
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val)
      trigger(target, key)
      return res
    },
    deleteProperty(target, key: string | symbol) {
      const hadKey = hasOwn(target, key)
      const result = Reflect.deleteProperty(target, key)
      if (hadKey && result)
        trigger(target, key)

      return result
    },
  })
  return proxy
}

export function isReactive(val) {
  return !!val[ReactiveFlags.IS_REACTIVE]
}
