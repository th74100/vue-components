import type { AllowClearConfig } from '@v-c/util'
import type { VueNode } from '@v-c/util/dist/type'
import { isVueRenderable, warning } from '@v-c/util'

/**
 * Used for `useFilledProps` since it already in the computed
 */
export function fillClearIcon(
  prefixCls: string,
  config: AllowClearConfig,
  clearIcon?: VueNode,
) {
  if (process.env.NODE_ENV !== 'production' && isVueRenderable(clearIcon)) {
    warning(false, '`clearIcon` will be removed in future. Please use `allowClear` instead.')
  }

  if (config.disabled) {
    return null
  }

  if (isVueRenderable(config.clearIcon)) {
    return config.clearIcon
  }

  return isVueRenderable(clearIcon) ? clearIcon : <span class={`${prefixCls}-clear-btn`} />
}
