# 【0. 开篇】我的 tdd-vue3

![cover](https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.jj20.com%2Fup%2Fallimg%2Ftp01%2F1Z913002051HL-0-lp.jpg&refer=http%3A%2F%2Fimg.jj20.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1652798754&t=20419e3afda1a1f3f3249cc4a9ce96b5)

## 开篇
---
最近一直在学习 Vue3 源码相关的知识，包括加入了崔大的 `mini-vue` 课程，阅读 hcy 大佬的 Vue.js 设计与实现，加上自己粗浅的一些理解，完成了一个简易的基于 `happy path` 完成的 [mini-vue](https://github.com/vancats/vancats-mini-vue3)。

在学习的过程中，我逐渐的意识到了 TDD 思想（Test-Driven Development）在编写代码时所带来的好处，它能很迅速的帮你理清思路，而且基于测试，我们在后续的开发中，更够更确定的知晓当下改动对先前功能的影响。

而基于以上思路，我突然冒出一个想法。Vue3 的单测非常详尽，那么我能不能根据它，基于源码一步步的实现其功能呢，毕竟笔者算是前端新人，可能过程很艰难，但是我还是想进行一次尝试！

## 搭建

---

![structure](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/68ca04d5f85f41afab0c7562d52c50cf~tplv-k3u1fbpfcp-watermark.image?)
既然是 Vue3 的模拟实现，代码框架也需要与其一致，我采用了 `monorepo` 的方式，目前新建了 `reactive` 和 `shared` 包，前者是我们当前需要实现的模块，后者存放公共内容。包内的 `__test__` 文件夹存放测试文件，`src` 则是实际代码。搭建部分不是我们的重点，如果想了解，可以看一下 [tdd-vue3](https://github.com/vancats/tdd-vue3)

## 起步

---

`reactive` 包中比较重要的一个函数就是 `effect`，我们也将从这里开始。

```ts
// 引入路径见下文
import { effect } from '../src/index'

// describe 表示了一个测试块
describe('reactivity/effect', () => {
  // it 表示了一个最小的测试用例，可能有些地方用的 test，两者没有任何区别
  it('should run the passed function once (wrapped by a effect)', () => {
    // 这是 jest 的语法，代表生成了一个函数
    const fnSpy = jest.fn(() => { })
    effect(fnSpy)
    // expect 期望 toHaveBeenCalledTimes 被调用的次数
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })
})
```
以上是 `effect.spec.ts` 的第一个单测。鉴于可能有小伙伴对于 `jest` 不太了解，代码中我加入了一些基本的注释。这个单测我们可以理解为，`effect` 可以接收一个函数，当我们执行 `effect` 之后，我们期望这个函数会被执行一次。

需要这个测试用例也是非常的简单啊，代码如下。

```ts
// src/effect.ts
export function effect(fn) {
  fn()
}
```

而为了管理方便，我们统一将代码从 `src/index.ts` 导出，由于后续可能会不断添加内容，为了方便，我们直接用 `*` 即可。

```ts
// src/index.ts
export * from './effect'
```

可以看到我们的单测已经通过了！

![test](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2f274d15ffa840ca8d2bd06dba15a58e~tplv-k3u1fbpfcp-watermark.image?)

## 总结

---

本篇大概讲述了我的整体总述与思考以及项目的搭建，最后我们完成了一个最简单的单测，也代表着征程已经开始了，让我们一起坚持下去吧！

---

我会根据每一个测试样例提交 `commit` 信息, 如果有错误或者描述的不对的地方，欢迎大家批评指正，可以私信我或者通过 [github](https://github.com/vancats) 来和我联系！如果觉得不错也可以给我的 [tdd-vue3](https://github.com/vancats/tdd-vue3) 点个小星星呀，感谢小伙伴们的支持！
