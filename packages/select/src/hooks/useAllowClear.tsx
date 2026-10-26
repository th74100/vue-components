import type { AllowClearConfig } from '@v-c/util'
import type { Ref } from 'vue'
import type { DisplayValueType, Mode } from '../interface.ts'
import { isVueRenderable, useAllowClear as useClearConfig } from '@v-c/util'
import { computed } from 'vue'

interface ClearInfo extends AllowClearConfig {
  allowClear: boolean
  clearIcon: any
  label: string
}

export function useAllowClear(
  _prefixCls: Ref<string>,
  displayValues: Ref<DisplayValueType[]>,
  allowClear?: Ref<boolean | AllowClearConfig | undefined>,
  clearIcon?: Ref<any>,
  disabled?: Ref<boolean>,
  mergedSearchValue?: Ref<string | undefined>,
  mode?: Ref<Mode | undefined>,
) {
  const allowClearConfig = useClearConfig(() => allowClear?.value)

  return computed<ClearInfo>(() => {
    const mergedAllowClear = !disabled?.value
      && !allowClearConfig.value.disabled
      && (displayValues.value.length || mergedSearchValue?.value)
      && !(mode?.value === 'combobox' && mergedSearchValue?.value === '')
    return {
      ...allowClearConfig.value,
      allowClear: !!mergedAllowClear,
      clearIcon: mergedAllowClear
        ? isVueRenderable(allowClearConfig.value.clearIcon)
          ? allowClearConfig.value.clearIcon
          : isVueRenderable(clearIcon?.value)
            ? clearIcon?.value
            : '×'
        : null,
      label: mergedAllowClear ? (allowClearConfig.value.label ?? 'Clear') : '',
    }
  })
}
