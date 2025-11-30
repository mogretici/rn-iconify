import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: false,
  },
  staticImage: true,
})

export default withNextra({
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
})
