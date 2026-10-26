import { mount } from '@vue/test-utils'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import Picker, { RangePicker } from '../src'
import generateConfig from '../src/generate/dayjs'
import enUS from '../src/locale/en_US'

// sync rc-picker#1021: unify allowClear configuration
const date = dayjs('2026-10-13')
const shared = { generateConfig, locale: enUS, suffix: 'suffix' }
const cases = [
  ['single', Picker, { ...shared, defaultValue: date }],
  ['multiple', Picker, { ...shared, multiple: true, defaultValue: [date] }],
  ['range', RangePicker, { ...shared, defaultValue: [date, date] }],
  ['time', Picker, { ...shared, picker: 'time', defaultValue: date }],
] as const

describe.each(cases)('picker allowClear %s', (_, Component, baseProps) => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('removes the clear entry and restores all configuration fields', async () => {
    const onClear = vi.fn()
    const config = Object.freeze({ clearIcon: 'custom', label: 'Erase', tabIndex: -1 })
    const wrapper = mount(Component as any, {
      attachTo: document.body,
      props: { ...baseProps, onClear, allowClear: false },
    })
    await nextTick()
    const markup = wrapper.html()

    await wrapper.setProps({ allowClear: { ...config, disabled: true } })
    expect(wrapper.html()).toBe(markup)
    expect(wrapper.find('.vc-picker-clear').exists()).toBe(false)
    expect(wrapper.find('.vc-picker-suffix').text()).toBe('suffix')
    expect(onClear).not.toHaveBeenCalled()

    await wrapper.setProps({ allowClear: config })
    const button = wrapper.find<HTMLButtonElement>('.vc-picker-clear')
    expect(button.attributes('aria-label')).toBe('Erase')
    expect(button.text()).toBe('custom')
    expect(button.element.tabIndex).toBe(-1)

    await wrapper.setProps({ allowClear: { ...config, tabIndex: 0 } })
    expect(wrapper.find<HTMLButtonElement>('.vc-picker-clear').element.tabIndex).toBe(0)

    await wrapper.find('.vc-picker-clear').trigger('click')
    await nextTick()
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.vc-picker-clear').exists()).toBe(false)
    wrapper.unmount()
  })
})
