import type { CSSProperties, VNode } from 'vue'
import { cloneElement } from '@v-c/util/dist/vnode'
import { Fragment, isVNode } from 'vue'
import isEnterOrSpaceKey from './isEnterOrSpaceKey'

export interface PaginationItemProps {
  'key'?: string | number
  'class'?: any
  'style'?: CSSProperties
  'title'?: string
  'disabled'?: boolean
  'tabIndex'?: number | null
  'onClick'?: (event: MouseEvent) => void
  'onKeyDown'?: (event: KeyboardEvent) => void
  'aria-label'?: string
  'aria-current'?: 'page'
  'aria-disabled'?: boolean
}

type Handler<E> = ((event: E) => void) | ((event: E) => void)[] | undefined

function callHandler<E>(handler: Handler<E>, event: E) {
  if (Array.isArray(handler)) {
    handler.forEach(fn => fn?.(event))
  }
  else {
    handler?.(event)
  }
}

function isDisabledValue(value: unknown) {
  return value === '' || !!value
}

function hasNativeActivation(target: EventTarget | null) {
  const element = target as HTMLElement | null
  return (
    element?.tagName === 'BUTTON'
    || (element?.tagName === 'A' && element.hasAttribute('href'))
  )
}

/**
 * Merge semantics onto DOM controls, preserving delegated interaction when a
 * custom renderer cannot be assumed to forward DOM props.
 */
export default function PaginationItem(props: PaginationItemProps, children: any): VNode {
  const {
    disabled,
    onClick,
    onKeyDown,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-current': ariaCurrent,
    'aria-disabled': ariaDisabled,
    ...restProps
  } = props

  const element = isVNode(children) ? children : null
  const elementProps: Record<string, any> = element?.props || {}
  const controlDisabled = !!(
    disabled
    || ariaDisabled === true
    || isDisabledValue(elementProps.disabled)
  )

  // Only DOM elements can reliably receive merged interaction props. Custom
  // components may not forward them, and Fragments host no DOM node, so retain
  // delegated interaction for those renderers and plain content.
  if (!element || typeof element.type !== 'string') {
    const isComponent = !!element
      && element.type !== Fragment
      && (typeof element.type === 'object' || typeof element.type === 'function')
    const content
      = isComponent && (ariaDisabled !== undefined || controlDisabled)
        ? cloneElement(element!, { disabled: controlDisabled })
        : children

    // Capture listeners are not part of Vue's typed DOM attributes.
    const captureProps: Record<string, any> = {
      onClickCapture: (event: MouseEvent) => {
        if (controlDisabled) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
      onKeydownCapture: (event: KeyboardEvent) => {
        if (controlDisabled && isEnterOrSpaceKey(event)) {
          event.preventDefault()
          event.stopPropagation()
        }
      },
    }

    return (
      <li
        {...restProps}
        {...captureProps}
        onClick={onClick}
        onKeydown={(event: KeyboardEvent) => {
          if (
            !controlDisabled
            && !event.defaultPrevented
            && !hasNativeActivation(event.target)
          ) {
            onKeyDown?.(event)
          }
        }}
        tabindex={controlDisabled || tabIndex == null ? -1 : tabIndex}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
        aria-disabled={controlDisabled || undefined}
      >
        {content}
      </li>
    )
  }

  const tabIndexKey = 'tabIndex' in elementProps ? 'tabIndex' : 'tabindex'
  const control = cloneElement(element, {
    'role': elementProps.href == null ? 'button' : undefined,
    'aria-label': elementProps['aria-label'] ?? ariaLabel,
    'aria-current': ariaCurrent,
    'aria-disabled': controlDisabled || undefined,
    [tabIndexKey]: controlDisabled || tabIndex == null ? -1 : 0,
    ...(element.type === 'button'
      ? { type: elementProps.type ?? 'button', disabled: controlDisabled }
      : {}),
    'onClick': (event: MouseEvent) => {
      if (controlDisabled) {
        event.preventDefault()
        return
      }
      callHandler(elementProps.onClick, event)
      if (!event.cancelBubble) {
        onClick?.(event)
      }
    },
    'onKeydown': (event: KeyboardEvent) => {
      if (controlDisabled) {
        if (isEnterOrSpaceKey(event)) {
          event.preventDefault()
        }
        return
      }
      callHandler(elementProps.onKeydown ?? elementProps.onKeyDown, event)
      if (event.defaultPrevented || event.cancelBubble) {
        return
      }
      // Native controls provide their own keyboard click synthesis. Activating
      // them here as well would fire twice.
      if (!hasNativeActivation(event.target)) {
        onKeyDown?.(event)
      }
    },
    'onKeyDown': undefined,
  })

  return <li {...restProps}>{control}</li>
}
