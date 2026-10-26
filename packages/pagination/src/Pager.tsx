import type { CSSProperties } from 'vue'
import type { PaginationProps } from './interface'
import { classNames } from '@v-c/util'
import { defineComponent } from 'vue'
import PaginationItem from './PaginationItem'

export interface PagerProps extends Pick<PaginationProps, 'itemRender'> {
  rootPrefixCls: string
  page: number
  /** Localized word for "page", prefixed to the number in the accessible name. */
  pageLabel?: string
  active?: boolean
  className?: string
  style?: CSSProperties
  showTitle: boolean
  disabled?: boolean
  onClick?: (page: number) => void
  onKeyPress?: (
    e: KeyboardEvent,
    onClick: PagerProps['onClick'],
    page: PagerProps['page'],
  ) => void
}

const Pager = defineComponent<PagerProps>((props) => {
  const handleClick = () => {
    props.onClick?.(props.page)
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    props.onKeyPress?.(e, props.onClick, props.page)
  }

  return () => {
    const {
      rootPrefixCls,
      page,
      pageLabel,
      active,
      className,
      showTitle,
      disabled,
      itemRender,
      style,
    } = props
    const prefixCls = `${rootPrefixCls}-item`

    const cls = classNames(
      prefixCls,
      `${prefixCls}-${page}`,
      {
        [`${prefixCls}-active`]: active,
        [`${prefixCls}-disabled`]: !page,
      },
      className,
    )

    const pager = itemRender?.(page, 'page', <a rel="nofollow">{page}</a>)
    const pagerLabel = `${pageLabel ?? ''} ${page}`.trim()

    return pager
      ? PaginationItem(
          {
            'title': showTitle ? String(page) : undefined,
            'class': cls,
            'style': style,
            'onClick': handleClick,
            'onKeyDown': handleKeyPress,
            'tabIndex': 0,
            'disabled': disabled || !page,
            'aria-label': pagerLabel,
            'aria-current': active ? 'page' : undefined,
          },
          pager,
        )
      : null
  }
})

export default Pager
