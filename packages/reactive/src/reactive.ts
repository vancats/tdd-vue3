import { track, trigger } from './effect'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  const proxy = new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key)
      track(target, key)
      if (key === ReactiveFlags.IS_REACTIVE)
        return true

      return res
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val)
      trigger(target, key)
      return res
    },
  })
  return proxy
}

export function isReactive(val) {
  return !!val[ReactiveFlags.IS_REACTIVE]
}
