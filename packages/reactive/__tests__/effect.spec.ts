import { effect } from '../src'

describe('reactivity/effect', () => {
  it('should run the passed function once (wrapped by a effect)', () => {
    const fnSpy = jest.fn(() => { })
    effect(fnSpy)
    expect(fnSpy).toHaveBeenCalledTimes(1)
  })
})
