import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import TextArea from '../src/TextArea'

describe('textArea allowClear', () => {
  it('applies allowClear tabIndex to the clear button while keeping mouse clear', async () => {
    const onClear = vi.fn()
    const wrapper = mount(TextArea, {
      props: {
        defaultValue: 'test',
        allowClear: { tabIndex: -1 },
        onClear,
      },
      attachTo: document.body,
    })
    const textarea = wrapper.find('textarea')
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.element.tabIndex).toBe(-1)

    await button.trigger('click')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(textarea.element)
    wrapper.unmount()
  })

  it('removes the clear entry when allowClear is disabled', async () => {
    const config = { clearIcon: 'custom', tabIndex: -1, label: 'Erase' }
    const wrapper = mount(TextArea, {
      props: { defaultValue: 'test', suffix: 'suffix', allowClear: false },
    })
    const disabledMarkup = wrapper.html()

    await wrapper.setProps({ allowClear: { ...config, disabled: true } })
    expect(wrapper.html()).toBe(disabledMarkup)
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('.vc-textarea-textarea-allow-clear').exists()).toBe(false)

    await wrapper.setProps({ allowClear: config })
    const clearButton = wrapper.find('button')
    expect(clearButton.attributes('aria-label')).toBe('Erase')
    expect(clearButton.text()).toBe('custom')
    expect(wrapper.find('.vc-textarea-textarea-allow-clear').exists()).toBe(true)
  })

  it('renders a pure textarea when allowClear is disabled', () => {
    const wrapper = mount(TextArea, {
      props: { defaultValue: 'test', allowClear: { disabled: true } },
    })
    expect(wrapper.element.tagName).toBe('TEXTAREA')
  })
})
