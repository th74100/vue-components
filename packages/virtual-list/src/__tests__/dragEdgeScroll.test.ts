import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import VirtualList from '../List'

// react-component/virtual-list#387: auto-scroll when a native drag reaches the
// edge of a virtual list.
const HOLDER = '.vc-virtual-list-holder'

let wrapper: VueWrapper

function mockRect(ele: Element, top: number, bottom: number) {
  vi.spyOn(ele, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: top,
    top,
    left: 0,
    right: 100,
    bottom,
    width: 100,
    height: bottom - top,
    toJSON: () => ({}),
  } as DOMRect)
}

async function mountList() {
  const data = Array.from({ length: 100 }, (_, i) => ({ id: i }))
  wrapper = mount(VirtualList, {
    props: { data, height: 100, itemHeight: 20, itemKey: 'id' },
    slots: { default: ({ item }: any) => h('div', { class: 'leaf' }, String(item.id)) },
    attachTo: document.body,
  })
  await wrapper.vm.$nextTick()

  // Container rect: top=0, bottom=100.
  // edgeThreshold = min(itemHeight * 1.2, height / 4) = min(24, 25) = 24.
  const holder = wrapper.find(HOLDER).element as HTMLDivElement
  mockRect(holder, 0, 100)
  return { holder, leaf: holder.querySelector('.leaf') as HTMLElement }
}

function dragOver(target: Element, clientY: number) {
  const event = new Event('dragover', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clientY', { value: clientY })
  target.dispatchEvent(event)
}

function nextFrames() {
  return new Promise(resolve => setTimeout(resolve, 60))
}

afterEach(() => {
  document.dispatchEvent(new Event('dragend'))
  wrapper?.unmount()
  vi.restoreAllMocks()
})

describe('virtual-list native drag edge scroll', () => {
  it('scrolls down when a drag reaches the bottom edge', async () => {
    const { holder, leaf } = await mountList()
    dragOver(leaf, 95)
    await nextFrames()
    expect(holder.scrollTop).toBeGreaterThan(0)
  })

  it('scrolls up when a drag reaches the top edge', async () => {
    const { holder, leaf } = await mountList()
    dragOver(leaf, 95)
    await nextFrames()
    document.dispatchEvent(new Event('dragend'))
    const before = holder.scrollTop
    expect(before).toBeGreaterThan(0)

    dragOver(leaf, 5)
    await nextFrames()
    expect(holder.scrollTop).toBeLessThan(before)
  })

  it('does not scroll while the pointer stays in the idle middle zone', async () => {
    const { holder, leaf } = await mountList()
    dragOver(leaf, 50)
    await nextFrames()
    expect(holder.scrollTop).toBe(0)
  })

  it('stops scrolling on drop even when the consumer stops propagation', async () => {
    const { holder, leaf } = await mountList()
    leaf.addEventListener('drop', e => e.stopPropagation())
    dragOver(leaf, 95)
    await nextFrames()
    leaf.dispatchEvent(new Event('drop', { bubbles: true }))
    const stopped = holder.scrollTop
    await nextFrames()
    expect(holder.scrollTop).toBe(stopped)
  })

  it('stops scrolling when the drag leaves the container', async () => {
    const { holder, leaf } = await mountList()
    dragOver(leaf, 95)
    await nextFrames()
    const event = new Event('dragleave', { bubbles: true })
    Object.defineProperty(event, 'relatedTarget', { value: document.body })
    holder.dispatchEvent(event)
    const stopped = holder.scrollTop
    await nextFrames()
    expect(holder.scrollTop).toBe(stopped)
  })
})
