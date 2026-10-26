import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Mentions from '../src'

// sync rc-mentions#341: unify allowClear configuration
describe('mentions allowClear', () => {
  it.each([undefined, 'suffix'])('removes the clear entry with suffix %s', async (suffix) => {
    const config = Object.freeze({ clearIcon: 'custom', tabIndex: -1, label: 'Erase' })
    const wrapper = mount(Mentions, {
      props: { defaultValue: 'test', suffix, allowClear: false },
    })
    const markup = wrapper.html()

    await wrapper.setProps({ allowClear: { ...config, disabled: true } })
    expect(wrapper.html()).toBe(markup)
    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.setProps({ allowClear: config })
    const button = wrapper.find('button')
    expect(button.attributes('aria-label')).toBe('Erase')
    expect(button.text()).toBe('custom')
    expect(button.element.tabIndex).toBe(-1)
  })
})
