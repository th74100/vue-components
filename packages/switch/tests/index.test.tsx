import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Switch from '../src'

describe('switch event handlers', () => {
  it('invokes onChange / onClick / onUpdate:checked on toggle', async () => {
    const onChange = vi.fn()
    const onClick = vi.fn()
    const onUpdate = vi.fn()
    const wrapper = mount(() => (
      <Switch
        onChange={onChange}
        onClick={onClick}
        {...{ 'onUpdate:checked': onUpdate }}
      />
    ))
    await wrapper.find('button').trigger('click')
    expect(onChange).toHaveBeenCalledWith(true, expect.any(MouseEvent))
    expect(onClick).toHaveBeenCalledWith(true, expect.any(MouseEvent))
    expect(onUpdate).toHaveBeenCalledWith(true)
  })

  it('fires click handlers exactly once per click', async () => {
    const onClick = vi.fn()
    const onChange = vi.fn()
    const onUpdate = vi.fn()
    const wrapper = mount(() => (
      <Switch
        onChange={onChange}
        onClick={onClick}
        {...{ 'onUpdate:checked': onUpdate }}
      />
    ))
    await wrapper.find('button').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not leak event handlers onto the DOM button as attributes', () => {
    const wrapper = mount(() => (
      <Switch
        onChange={() => {}}
        onClick={() => {}}
        onKeyDown={() => {}}
        {...{ 'onUpdate:checked': () => {} }}
      />
    ))
    const btn = wrapper.find('button').element as HTMLElement
    expect(btn.getAttribute('onChange')).toBeNull()
    expect(btn.getAttribute('onUpdate:checked')).toBeNull()
    expect(btn.getAttribute('onKeyDown')).toBeNull()
  })

  it.each([false, true])('does not emit a change for an arrow that retains %s', async (checked) => {
    const onChange = vi.fn()
    const onKeyDown = vi.fn()
    const wrapper = mount(() => (
      <Switch defaultChecked={checked} onChange={onChange} onKeyDown={onKeyDown} />
    ))
    const button = wrapper.find('button')
    const keyDown = async (which: number) => {
      const event = new KeyboardEvent('keydown', { bubbles: true })
      Object.defineProperty(event, 'which', { value: which })
      button.element.dispatchEvent(event)
      await nextTick()
    }

    await keyDown(checked ? 39 : 37)
    expect(onChange).not.toHaveBeenCalled()
    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(button.attributes('aria-checked')).toBe(String(checked))

    await keyDown(checked ? 37 : 39)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(!checked, expect.any(KeyboardEvent))
  })
})
