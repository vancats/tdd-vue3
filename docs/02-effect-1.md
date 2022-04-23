[2. effect]

![cover](https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fpic1.zhimg.com%2Fv2-bdf0c7fccdd65437bf9c44f99f05e68c_r.jpg&refer=http%3A%2F%2Fpic1.zhimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1653145762&t=824274760e6bddb30f45e0505764f86a)

## 概述

---

大家好，这是我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 的第三篇文章。文内的代码以实现测试用例为主，以 Vue3 为目标，但是实现形式不一定一样哦。本篇将实现 effect 的第二个测试用例。

## 测试用例

---

```ts
describe('reactivity/effect', () => {
  it('should observe basic properties', () => {
    let dummy
    const counter = reactive({ num: 0 })
    effect(() => (dummy = counter.num))

    expect(dummy).toBe(0)
    counter.num = 7
    expect(dummy).toBe(7)
  })
})
```

## 具体实现

### 分析测试用例

分析以上内容，首先，我们获得一个 `reactive` 的对象，命名为 `counter`。然后调用 `effect` 函数，从第一个测试用例可知，`effect` 会执行传入的函数，也就是我们会给 `dummy` 赋值成 `counter.num`，而我们的 `reactive` 的第一个测试用例告诉我们，此时 `dummy = 0`，第一个断言自然通过。

那么这个测试用例的关键就在于这两行了。

```ts
counter.num = 7
expect(dummy).toBe(7)
```

当我们对 `count` 的 `num` 进行赋值的时候，`dummy` 的值也会变化。而这，不就是一个简单的响应式嘛！那我们如何来实现这样的一个响应式比较合理呢，可以看到，`dummy` 在 `effect` 中进行了存值，假设当我们存的值，如用例中的 `counter.num` 发生了变化，就重新执行这个函数，那么，`dummy` 根据更新后的值来赋值，我们的问题是不是就解决了呢～以上就是我们的分析思路，接下来让我们来试试把他实现出来吧！

### 代码实现

很显然的是，当我们触发了属性对 `get` 操作时，需要进行依赖收集，而触发 `set` 操作时，则更新该属性的所有依赖即可。

#### ReactiveEffect

我们发现，`effect` 中传入的函数需要进行重复调用，后续可能会有更多的功能需要实现，原先以直接调用来实现，现在我们将其重新封装成一个 class 对象，易于后续的扩展。

```ts
export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

export class ReactiveEffect<T = any> {
  private _fn: () => T
  constructor(public fn: () => T) {
    this._fn = fn
  }

  run() {
    this._fn()
  }
}
```

#### targetMap

依赖收集是响应式中至关重要的一环，其中数据结构的处理也非常重要。

![targetMap.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/62242901bbf84a92893968ba93959dec~tplv-k3u1fbpfcp-watermark.image?)

具体的数据结构如图所示，共三级组成，由 `target` 与 `key` 可以寻找到当前 `key` 对应的所有依赖，收集依赖时存入，触发依赖时取出并循环调用其 `run` 方法。

#### track

完成了上述操作之后，紧接着让我们来实现依赖收集的工作，我们需要逐层级存入依赖。

```ts
type Dep = Set<ReactiveEffect>
type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<any, KeyToDepMap>()

export function track(target: object, key: unknown) {
  let depsMap = targetMap.get(target)
  if (!depsMap)
    // 如果为空，初始化
    targetMap.set(target, (depsMap = new Map()))

  let dep = depsMap.get(key)
  if (!dep)
    // 如果为空，初始化
    depsMap.set(key, (dep = new Set()))
  // 在这里进行依赖收集工作
  trackEffects(dep)
}

export function trackEffects(dep: Dep) {
  dep.add(/* ? */)
}
```

上述的流程看似一步到位，但是当我们走到最后一步时，会发现两个问题：
1. 应该存入什么值？
2. 我们存的值从哪里来？

首先回答第一个问题哦，我们存入的是依赖，那依赖是不是就是 `effect` 呢，那么我们该从哪里获取到当前的 `effect` 呢？顺着往上走，我们知道，在执行 `run` 函数的时候，我们会进行收集工作，而这里，我们也可以获取到当前的 `effect` 实例。那么，我们存一个全局变量存当前变量，在执行 `run` 函数的时候更新它的值就可以啦！

```ts
let activeEffect: ReactiveEffect | undefined
class ReactiveEffect {
  // ...
  run() {
    activeEffect = this
    this._fn()
  }
}
```

现在，我们把 `activeEffect` 存入 `dep` 即可

```ts
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}
```

至此，依赖收集结束啦～

#### trigger

接下来就是我们的依赖收集工作咯，我们只需要按步骤取出依赖进行循环调用其 `run` 函数就可以啦。

```ts
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
```

然后我们在 `get`，`set` 操作的时候进行 `track` 和 `trigger` 就可以啦！

```ts
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
```

最后，我们来跑一下测试用例，可以看到，还是很顺利的通过了我们的测试，真不错嘿嘿！

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ac4455326ae8412f966d8220808665e9~tplv-k3u1fbpfcp-watermark.image?)

## 总结

---

本篇通过了 `effect` 的第二个测试用例，实现了我们响应式的重中之重--依赖收集环节，其数据结构和中间实现的过程也非常的巧妙，大家可以自行去尝试一下哦！

---

我会根据每一个测试样例提交 `commit` 信息, 如果有错误或者描述的不对的地方，欢迎大家批评指正，可以私信我或者通过 [github](https://github.com/vancats) 来和我联系！如果觉得不错也可以给我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 点个小星星呀，感谢小伙伴们的支持！
