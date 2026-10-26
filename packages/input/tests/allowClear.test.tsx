import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import Input from '../src/input'

/**
 * jsdom does not perform real Tab-key navigation. Simulate the browser tab
 * order instead: collect focusable elements in DOM order and drop disabled
 * ones and those with a negative tabIndex.
 */
function getTabOrder(root: Element) {
  return Array.from(root.querySelectorAll<HTMLElement>('input, button')).filter(
    el => !el.disabled && el.tabIndex >= 0,
  )
}

describe('input allowClear', () => {
  it.each([undefined, 'suffix'])(
    'removes the clear entry without changing other suffixes: %s',
    async (suffix) => {
      const onChange = vi.fn()
      const onClear = vi.fn()
      const config = Object.freeze({
        clearIcon: 'custom',
        tabIndex: -1,
        label: 'Erase',
      })
      const wrapper = mount(Input, {
        props: { defaultValue: 'test', suffix, onChange, onClear, allowClear: false },
      })
      const disabledMarkup = wrapper.html()

      await wrapper.setProps({ allowClear: { ...config, disabled: true } })
      expect(wrapper.html()).toBe(disabledMarkup)
      expect(wrapper.find('button').exists()).toBe(false)
      expect(wrapper.find('input').element.value).toBe('test')
      expect(onChange).not.toHaveBeenCalled()
      expect(onClear).not.toHaveBeenCalled()

      await wrapper.setProps({ allowClear: config })
      const clearButton = wrapper.find('button')
      expect(clearButton.attributes('aria-label')).toBe('Erase')
      expect(clearButton.text()).toBe('custom')
      expect(clearButton.element.tabIndex).toBe(-1)
      await clearButton.trigger('click')
      expect(wrapper.find('input').element.value).toBe('')
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onClear).toHaveBeenCalledTimes(1)
      expect(config).toEqual({
        clearIcon: 'custom',
        tabIndex: -1,
        label: 'Erase',
      })
    },
  )

  it('preserves the input element when a suffix keeps the wrapper mounted', async () => {
    const wrapper = mount(Input, {
      props: { suffix: 'suffix', defaultValue: 'test', allowClear: true },
      attachTo: document.body,
    })
    const input = wrapper.find('input').element
    input.focus()
    input.setSelectionRange(1, 3)
    await wrapper.setProps({ allowClear: { disabled: true } })
    expect(wrapper.find('input').element).toBe(input)
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(3)
    wrapper.unmount()
  })

  it('uses the default accessible name', () => {
    const wrapper = mount(Input, {
      props: { defaultValue: 'test', allowClear: true },
    })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Clear')
  })

  it.each([true, {}, { tabIndex: 0 }])(
    'keeps the clear button keyboard accessible with %j',
    async (allowClear) => {
      const wrapper = mount(Input, {
        props: { defaultValue: 'test', allowClear },
        attachTo: document.body,
      })
      const input = wrapper.find('input')
      const button = wrapper.find('button')
      expect(button.element.tabIndex).toBe(0)

      // Simulate tabbing from the input to the clear button, then activating
      // it (browsers map Enter on a focused button to a click event).
      input.element.focus()
      expect(document.activeElement).toBe(input.element)
      button.element.focus()
      expect(document.activeElement).toBe(button.element)
      await button.trigger('click')
      expect((input.element as HTMLInputElement).value).toBe('')
      expect(document.activeElement).toBe(input.element)
      wrapper.unmount()
    },
  )

  it('skips the clear button in both tab directions while allowing click to clear', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const wrapper = mount(
      {
        setup: () => () => (
          <div>
            <Input
              defaultValue="test"
              allowClear={{ tabIndex: -1 }}
              onChange={onChange}
              onClear={onClear}
            />
            <Input defaultValue="second" allowClear />
          </div>
        ),
      },
      { attachTo: document.body },
    )
    const inputs = wrapper.findAll('input')
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)

    // Forward and reverse tab order both skip the -1 button of the first
    // input while still reaching the default button of the second input.
    const order = getTabOrder(wrapper.element)
    expect(order).toEqual([
      inputs[0].element,
      inputs[1].element,
      buttons[1].element,
    ])
    expect(order.slice().reverse()).not.toContain(buttons[0].element)

    // Mouse interaction still clears the first input.
    await buttons[0].trigger('click')
    expect((inputs[0].element as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(inputs[0].element)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onClear).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('updates the clear button tabIndex independently of the input', async () => {
    const currentProps = reactive({
      defaultValue: 'test',
      tabIndex: 3,
      allowClear: { tabIndex: 2 } as any,
    })
    const wrapper = mount(() => <Input {...currentProps} />, {
      attachTo: document.body,
    })
    expect(wrapper.find('input').element.tabIndex).toBe(3)
    expect(wrapper.find('button').element.tabIndex).toBe(2)

    Object.assign(currentProps, { allowClear: true })
    await nextTick()
    expect(wrapper.find('button').element.tabIndex).toBe(0)
    expect(wrapper.find('input').element.tabIndex).toBe(3)
    wrapper.unmount()
  })
})
