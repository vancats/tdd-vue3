
![cover](https://gimg2.baidu.com/image_search/src=http%3A%2F%2Ftupian.qqjay.com%2Fu%2F2015%2F1122%2F29_2103_10.jpg&refer=http%3A%2F%2Ftupian.qqjay.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1654440789&t=d5fce203862b3957c80576a7b64e3f86)

## 概述

---

大家好，这是我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 的第四篇文章。文内的代码以实现测试用例为主，以 Vue3 为目标，但是实现形式不一定一样哦。本篇将实现 effect 的测试用例。

## 测试用例

```ts
it('should observe multiple properties', () => {
  let dummy
  const counter = reactive({ num1: 0, num2: 0 })
  effect(() => (dummy = counter.num1 + counter.num1 + counter.num2))

  expect(dummy).toBe(0)
  counter.num1 = counter.num2 = 7
  expect(dummy).toBe(21)
})

it('should handle multiple effects', () => {
  let dummy1, dummy2
  const counter = reactive({ num: 0 })
  effect(() => (dummy1 = counter.num))
  effect(() => (dummy2 = counter.num))

  expect(dummy1).toBe(0)
  expect(dummy2).toBe(0)
  counter.num++
  expect(dummy1).toBe(1)
  expect(dummy2).toBe(1)
})

it('should observe nested properties', () => {
  let dummy
  const counter = reactive({ nested: { num: 0 } })
  effect(() => (dummy = counter.nested.num))
  expect(dummy).toBe(0)
  counter.nested.num = 8
  expect(dummy).toBe(8)
})

it('should observe delete operations', () => {
  let dummy
  const obj = reactive({ prop: 'value' })
  effect(() => (dummy = obj.prop))
  expect(dummy).toBe('value')
  // @ts-ignore
  delete obj.prop
  expect(dummy).toBe(undefined)
})
```

首先要提到的是，我的代码思路是参考 Vue3 具体实现，因此并不是所有测试用例都需要重新写代码加入新功能，例如上文中的 与 实际上使用之前的代码也是会直接通过的。

**should observe multiple properties**

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/973ee1affa14445ab40f4641c91a8dc6~tplv-k3u1fbpfcp-watermark.image?)

**should handle multiple effects**

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ef1d111e2f0749d59a021315d715510c~tplv-k3u1fbpfcp-watermark.image?)

## 具体实现

---

### 分析测试用例

---

首先让我们回头查看一下原先的 `proxy` 代码：

```ts
const proxy = new Proxy(raw, {
  get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE)
      return true
    const res = Reflect.get(target, key)
    track(target, key)
    return res
  },
  set(target, key, val) {
    const res = Reflect.set(target, key, val)
    trigger(target, key)
    return res
  },
})
```

先来观察一下第三个测试用例，实际需要返回的内容其实是嵌套的 `reactive`。显然，我们并没有做一个嵌套的设计，而实现起来也非常简单，只需要进行一个递归调用即可。

由于以上代码量过少，因此本篇还加上了第四个测试用例。

在目前的代码中，我们的 `proxy` 拦截了 `get` 和 `set` 操作，显然这两个操作并不满足所有的场景需要，该用例强调的就是当我们进行 delete 操作时，也是需要进行响应的哦。

### 代码实现

---

当我们拦截 `get` 操作中，会得到一个 `Reflect` 返回的映射值 `res`，如果是一个原始值，直接返回即可，而当是一个对象时，我们需要进行嵌套的实现 `reactive`。

```ts
if (isObject(res))
  return reactive(res)
```

打开测试用例，可以看到我们已经成功通过了哦！

**should observe nested properties**

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7777e7cf0c55471da0f94e9cb9fa5192~tplv-k3u1fbpfcp-watermark.image?)

接下来，我们来解决 `delete` 的响应式操作。首先，我们需要了解到 `proxy` 拦截的方式，它在 MDN 中的解释如下图，我们通过 `deleteProperty` 可以进行接下来的操作。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/de75634700a5410181841c126c84bb1d~tplv-k3u1fbpfcp-watermark.image?)

```ts
const proxy = new Proxy(raw, {
  deleteProperty(target, key) {
    // ...
  },
})
```

同样的，传入 `target` 和 `key`，对于删除操作，我们需要多做一步操作，我们需要先确认传入的 `target` 是否有 `key` 属性值，有的话再删除，没有的话自然不进行下一步操作了，因此我们可以写一个 `hasOwn` 函数。

```ts
const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (
  val: object,
  key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key)
```

这个属于较为简单的函数调用，调用了 `Object` 原型链上的 `hasOwnProperty` 方法，总而言之，我们可以通过它得知该 `target` 中是否含有 `key` 属性值。

```ts
const proxy = new Proxy(raw, {
  deleteProperty(target, key: string | symbol) {
    const hadKey = hasOwn(target, key)
    const result = Reflect.deleteProperty(target, key)
    if (hadKey && result)
      trigger(target, key)
    return result
  },
})
```

如果 `hasOwn` 返回为真值且我们正确删除了该属性值 `key`，那么，我们需要进行响应式的调用，这时候就非常方便了，直接调用 `trigger` 函数，传入 `target` 和 `key` 就可以了哦！可以看到已经通过测试用例啦！

**should observe delete operations**

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/61cdf75c048d4810960d33a447b04d14~tplv-k3u1fbpfcp-watermark.image?)


下面是我们最新的 `Proxy` 代码

```ts
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
```

还有记得要回测所有的测试哦！结果也是自然没问题啦

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3f16ec9e72a84df48c66039e507337d7~tplv-k3u1fbpfcp-watermark.image?)

## 总结

---

本篇通过了 `effect` 接下来的四个测试用例，实现了 `reactive` 的嵌套响应式系统以及 `delete` 操作符 的响应式内容！

---

我会根据每一个测试样例提交 `commit` 信息, 如果有错误或者描述的不对的地方，欢迎大家批评指正，可以私信我或者通过 [github](https://github.com/vancats) 来和我联系！如果觉得不错也可以给我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 点个小星星呀，感谢小伙伴们的支持！
