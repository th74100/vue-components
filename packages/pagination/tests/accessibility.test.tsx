import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import Pagination from '../src/index'

// sync rc-pagination#728: move pagination control semantics off list items
const antdIcons = {
  prevIcon: <button type="button" tabindex={-1}>Previous icon</button>,
  nextIcon: <button type="button" tabindex={-1}>Next icon</button>,
  jumpPrevIcon: <a class="vc-pagination-item-link"><span>Previous jump icon</span></a>,
  jumpNextIcon: <a class="vc-pagination-item-link"><span>Next jump icon</span></a>,
}

function keydown(el: Element, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('accessible pagination controls', () => {
  it.each([
    { total: 1000, defaultCurrent: 50 },
    { total: 1000, defaultCurrent: 50, ...antdIcons },
    { total: 1000, defaultCurrent: 1 },
    { total: 1000, defaultCurrent: 100 },
    { total: 1000, defaultCurrent: 50, disabled: true, ...antdIcons },
    { total: 1000, defaultCurrent: 1, simple: true },
    { total: 0 },
    { total: 1000, defaultCurrent: 50, itemRender: (_: any, __: any, element: any) => element },
    { total: 1000, defaultCurrent: 50, itemRender: (page: number) => <button>{page}</button> },
    { total: 1000, defaultCurrent: 50, itemRender: (page: number) => <a href={`#${page}`}>{page}</a> },
  ])('keeps control semantics off list items for %#', (props) => {
    const wrapper = mount(Pagination, { props: { ...props, onChange: () => {} } as any })
    wrapper.findAll('li').forEach((item) => {
      expect(item.attributes('role')).toBeUndefined()
      expect(item.attributes('tabindex')).toBeUndefined()
    })
    expect(wrapper.find('button button').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each(['prev', 'next', 'jump-prev', 'jump-next', 'item-51'])(
    'activates %s exactly once per action',
    async (type) => {
      const onChange = vi.fn()
      const wrapper = mount(Pagination, {
        props: { total: 1000, defaultCurrent: 50, onChange, ...antdIcons },
        attachTo: document.body,
      })
      const control = wrapper.find(`.vc-pagination-${type} > button, .vc-pagination-${type} > a`)
      expect(control.exists()).toBe(true)
      const isNative = control.element.tagName === 'BUTTON'
        || (control.element as HTMLElement).hasAttribute('href')
      // Native controls synthesize click from Enter/Space, others rely on keydown.
      if (isNative)
        await control.trigger('click')
      else
        keydown(control.element, 'Enter')
      expect(onChange).toHaveBeenCalledTimes(1)
      wrapper.unmount()
    },
  )

  it('has one focus target per item and exposes its current/disabled state', () => {
    const wrapper = mount(Pagination, { props: { total: 30, onChange: () => {} } })
    const first = wrapper.find('.vc-pagination-item-1 a')
    expect(first.attributes('tabindex')).toBe('0')
    expect(first.attributes('role')).toBe('button')
    expect(first.attributes('aria-current')).toBe('page')
    expect(first.attributes('aria-label')).toBeTruthy()
    expect(wrapper.find('.vc-pagination-item-2 a').attributes('tabindex')).toBe('0')
    const prev = wrapper.find('.vc-pagination-prev button')
    expect(prev.attributes('aria-disabled')).toBe('true')
    expect(prev.attributes('tabindex')).toBe('-1')
    wrapper.unmount()
  })

  it('prevents navigation from a disabled custom link', () => {
    const onChange = vi.fn()
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        disabled: true,
        onChange,
        itemRender: (page: number) => <a href={`#${page}`}>{page}</a>,
      },
    })
    const link = wrapper.find('.vc-pagination-item-2 a').element
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps keyboard behavior for plain custom content', () => {
    const onChange = vi.fn()
    const wrapper = mount(Pagination, {
      props: { total: 100, onChange, itemRender: (page: number) => <span>{page}</span> },
    })
    const control = wrapper.find('.vc-pagination-item-2 > span')
    expect(control.attributes('tabindex')).toBe('0')
    keydown(control.element, 'Enter')
    expect(onChange).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('composes custom click handlers without duplicate activation', async () => {
    const onClick = vi.fn()
    const onChange = vi.fn()
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        onChange,
        itemRender: (page: number) => <button onClick={onClick}>{page}</button>,
      },
    })
    const control = wrapper.find('.vc-pagination-item-2 button')
    // Enter on a native button only synthesizes a click.
    keydown(control.element, 'Enter')
    expect(onChange).not.toHaveBeenCalled()
    await control.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('respects custom controls that stop propagation or are disabled', async () => {
    const onChange = vi.fn()
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        onChange,
        itemRender: (page: number) => (
          <button disabled={page === 3} onClick={(event: MouseEvent) => event.stopPropagation()}>
            {page}
          </button>
        ),
      },
    })
    await wrapper.find('.vc-pagination-item-2 button').trigger('click')
    expect(onChange).not.toHaveBeenCalled()
    expect((wrapper.find('.vc-pagination-item-3 button').element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('delegates interaction to the list item for custom components', async () => {
    const onChange = vi.fn()
    const Custom = defineComponent({
      props: { page: Number, disabled: Boolean },
      setup: props => () => h('span', { 'class': 'custom', 'data-disabled': String(props.disabled) }, String(props.page)),
    })
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        onChange,
        itemRender: (page: number) => h(Custom, { page }),
      },
    })
    const item = wrapper.find('.vc-pagination-item-2')
    expect(item.attributes('tabindex')).toBe('0')
    expect(item.attributes('role')).toBeUndefined()
    await item.find('.custom').trigger('click')
    expect(onChange).toHaveBeenCalledTimes(1)
    keydown(wrapper.find('.vc-pagination-item-3').element, 'Enter')
    expect(onChange).toHaveBeenCalledTimes(2)

    await wrapper.setProps({ disabled: true })
    const disabledItem = wrapper.find('.vc-pagination-item-2')
    expect(disabledItem.attributes('tabindex')).toBe('-1')
    expect(disabledItem.attributes('aria-disabled')).toBe('true')
    expect(disabledItem.find('.custom').attributes('data-disabled')).toBe('true')
    await disabledItem.find('.custom').trigger('click')
    expect(onChange).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })
})
