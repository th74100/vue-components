// @vitest-environment jsdom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { Circle, Line } from '../src'

describe('progress semantics', () => {
  it.each([
    ['line', Line, '.vc-progress-line-rail'],
    ['circle', Circle, '.vc-progress-circle-rail'],
  ])('honors zero rail width for %s progress', (_, Component, railSelector) => {
    const wrapper = mount(Component, {
      props: {
        prefixCls: 'vc-progress',
        percent: 50,
        railWidth: 0,
        strokeWidth: 2,
      },
    })

    expect(wrapper.find(railSelector).attributes('stroke-width')).toBe('0')
  })

  it('uses presentational semantics for decorative progress', () => {
    const wrapper = mount(Line, {
      props: {
        prefixCls: 'vc-progress',
        percent: 50,
      },
    })

    expect(wrapper.attributes('role')).toBe('presentation')
  })

  it.each([
    ['line', Line],
    ['circle', Circle],
  ])('forwards explicit accessible SVG semantics to %s progress', (_, Component) => {
    const wrapper = mount(Component, {
      props: {
        id: 'upload-progress',
        prefixCls: 'vc-progress',
        percent: 50,
      },
      attrs: {
        'aria-label': 'Upload progress',
        'aria-valuemax': '100',
        'aria-valuemin': '0',
        'aria-valuenow': '50',
        'role': 'progressbar',
      },
    })

    expect(wrapper.attributes()).toMatchObject({
      'aria-label': 'Upload progress',
      'aria-valuemax': '100',
      'aria-valuemin': '0',
      'aria-valuenow': '50',
      'id': 'upload-progress',
      'role': 'progressbar',
    })
  })

  it('supports semantic classNames and styles for line progress', () => {
    const wrapper = mount(Line, {
      props: {
        percent: [20, 30],
        className: 'custom',
        classNames: { root: 'my-root', rail: 'my-rail', track: 'my-track' },
        styles: {
          root: { width: '200px' },
          rail: { opacity: '0.5' },
          track: { opacity: '0.8' },
        },
      },
    })
    const root = wrapper.find('svg')
    expect(root.classes()).toEqual(['vc-progress-line', 'my-root', 'custom'])
    expect(root.element.style.width).toBe('200px')
    const rail = wrapper.find('.vc-progress-line-rail')
    expect(rail.classes()).toContain('my-rail')
    expect((rail.element as SVGElement).style.opacity).toBe('0.5')
    const tracks = wrapper.findAll('.vc-progress-line-path')
    expect(tracks).toHaveLength(2)
    tracks.forEach((track) => {
      expect(track.classes()).toContain('my-track')
      expect((track.element as SVGElement).style.opacity).toBe('0.8')
    })
  })
})
