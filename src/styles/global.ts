import { globalCss } from '@eric-ignite-ui/react'

export const globalStyles = globalCss({
  '*': {//all elements
    boxSizing: 'border-box',
    padding: 0,
    margin: 0
  },

  body: {
    background: '$gray900',
    color: '$gray100',
    '-webkit-font-smoothing': 'antialiased',
  }
})