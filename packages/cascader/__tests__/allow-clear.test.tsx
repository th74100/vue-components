import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Cascader from '../src'

// jsdom duplicates CSS custom properties on re-render; compare structure only.
const stripStyle = (html: string) => html.replace(/ style="[^"]*"/g, '')

async function flush() {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve))
  await nextTick()
}

// sync rc-cascader#668: unify allowClear configuration
describe.each([false, true])('cascader allowClear checkable=%s', (checkable) => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('passes the complete configuration to Select and preserves clear callbacks', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const config = { clearIcon: 'custom', label: 'Erase', tabIndex: -1 }
    const wrapper = mount(Cascader as any, {
      attachTo: document.body,
      props: {
        options: [{ value: 'one', label: 'One' }],
        checkable,
        defaultValue: checkable ? [['one']] : ['one'],
        onChange,
        onClear,
        allowClear: false,
      },
    })
    await flush()
    const markup = stripStyle(wrapper.html())

    await wrapper.setProps({ allowClear: { ...config, disabled: true } })
    await flush()
    expect(stripStyle(wrapper.html())).toBe(markup)
    expect(wrapper.find('.vc-cascader-clear').exists()).toBe(false)

    await wrapper.setProps({ allowClear: config })
    await flush()
    const button = wrapper.find<HTMLButtonElement>('.vc-cascader-clear')
    expect(button.attributes('aria-label')).toBe('Erase')
    expect(button.text()).toBe('custom')
    expect(button.element.tabIndex).toBe(-1)

    await button.trigger('click')
    await flush()
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.vc-cascader-clear').exists()).toBe(false)
    wrapper.unmount()
  })
})
