import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { VueNode } from '../type'
import { computed, toValue } from 'vue'

export interface AllowClearConfig {
  clearIcon?: VueNode
  /** Disable the clear entry without rendering a button or reserving space. */
  disabled?: boolean
  tabIndex?: number
  /** Accessible name for the clear button. */
  label?: string
}

/** Normalize clear configuration. Components should apply their defaults first. */
export function normalizeAllowClear(
  allowClear?: boolean | AllowClearConfig,
): AllowClearConfig {
  return allowClear && typeof allowClear === 'object'
    ? { ...allowClear, disabled: allowClear.disabled ?? false }
    : { disabled: !allowClear }
}

export default function useAllowClear(
  allowClear: MaybeRefOrGetter<boolean | AllowClearConfig | undefined>,
): ComputedRef<AllowClearConfig> {
  return computed(() => normalizeAllowClear(toValue(allowClear)))
}
