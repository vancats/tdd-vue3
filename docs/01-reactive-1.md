[1. Reactive]

![cover](https://img2.baidu.com/it/u=3323947045,2269974061&fm=253&fmt=auto&app=120&f=JPEG?w=889&h=500)

## 概述

---

大家好，这是我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 的第二篇文章。文内的代码以实现测试用例为主，以 Vue3 为目标，但是实现形式不一定一样哦。

## 测试用例

---

本篇将实现 `reactive` 的第一个测试用例。

```ts
// reactive.spec.ts 默认还是从 src 导入哦
import { isReactive, reactive } from '../src'

describe('reactivity/reactive', () => {
  test('Object', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    // get
    expect(observed.foo).toBe(1)
    // has
    expect('foo' in observed).toBe(true)
    // ownKeys
    expect(Object.keys(observed)).toEqual(['foo'])
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
  })
})
```

## 具体实现

### 分析测试用例

Vue3 的 `reactive` 函数相比小伙伴们都已经非常清楚了，它的作用是创建一个响应式的对象，当然，目前我们面对的只是第一个测试用例，不用考虑过多，仅针对测试用例的输出是很关键的哦！

首先，让我们来观察一下以上测试用例。

```ts
const observed = reactive(original)
expect(observed).not.toBe(original)
```

这其中的含义不难解读：`reactive` 接收一个对象，并返回一个对象，返回的对象与原对象不同。

```ts
// get
expect(observed.foo).toBe(1)
// has
expect('foo' in observed).toBe(true)
// ownKeys
expect(Object.keys(observed)).toEqual(['foo'])
```

这三个断言都是对 `reactive` 返回对象的值进行了约束与判断。

**总体的逻辑是：传入一个对象，返回一个新对象，两者不同但是取得的值完全一致。**

大家熟知的 Vue2 中，响应式对象通过 `Object.defineProperty` 拦截，而 Vue3 实际使用的是 `Proxy` 代理对象，它是一种更广泛的代理，从单个属性扩展到了整个对象，在用法和性能上都有了一个质的飞跃。

### 代码实现

```ts
export function reactive(raw) {
  const proxy = new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key)
      return res
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val)
      return res
    },
  })
  return proxy
}
```

首先，我们返回一个 Proxy 对象，第一个参数传入我们的原对象，
然后对 `get`，`set`操作进行拦截，使用 `Reflect` 后返回该值，最后我们返回的是当前的 `proxy` 对象，与原对象当然不同，而我们的 `proxy` 仅仅是对属性进行拦截，不改变其原有操作，因此取值与原先没有差别。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/52567f7c58614a8b9b62ae7a17b24925~tplv-k3u1fbpfcp-watermark.image?)

可以看到，我们这部分的测试用例已经通过了！（每次跑测试我都会测试所有的用例哦，有两个 `pass` 是加上了上一篇 `effect` 的测试用例。

### isReactive

---

眼尖的小伙伴可能已经发现了，在测试用例中还有这两条呢！

```ts
expect(isReactive(observed)).toBe(true)
expect(isReactive(original)).toBe(false)
```

很容易理解，它的含义是，判断当前的对象是不是一个 `reactive`。那我们要从哪里来判断最好呢？答案是，创建一个特殊的 `api`，在我们进行 `get` 操作时，对其进行拦截即可，是不是很妙的实现方式呢嘿嘿。

```ts
const proxy = new Proxy(raw, {
  get(target, key) {
    // ...
    if (key === ReactiveFlags.IS_REACTIVE)
      return true
    // ...
  },
})
```

以上，我们的实现就完成了，但是让我们仔细想想，我们使用一个拗口的不易被用户使用到的字符串来代替 `reactive` 会不会更好一些呢？而字符串形式在源码中显然并没有那么可靠，复用性也不高，因此我们采取以下形式来实现 `isReactive`，因此，我们最终的实现如下所示。

```ts
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
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
```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b8aea76654045338093260c5d53516e~tplv-k3u1fbpfcp-watermark.image?)

可以看到测试用例还是一个通过的状态，至此，代码编写就结束啦。

## 总结

---

本篇通过了 `reactive` 的第一个测试用例，我们采用 `proxy` 对原对象进行了统一的属性拦截，并提供了工具函数 `isReactive` 的实现方式。

---

我会根据每一个测试样例提交 `commit` 信息, 如果有错误或者描述的不对的地方，欢迎大家批评指正，可以私信我或者通过 [github](https://github.com/vancats) 来和我联系！如果觉得不错也可以给我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 点个小星星呀，感谢小伙伴们的支持！
