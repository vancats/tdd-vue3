
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  const proxy = new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key)

      if (key === ReactiveFlags.IS_REACTIVE)
        return true

      return res
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val)
      return res
    },
  })
  return proxy
}

export function isReactive(val) {
  return !!val[ReactiveFlags.IS_REACTIVE]
}
