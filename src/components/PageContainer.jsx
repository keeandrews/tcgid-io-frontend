import React from 'react'
import Box from '@mui/material/Box'

const resolveMaxWidth = (value) => {
  if (value === false || value === 'full' || value === '100%') {
    return '100%'
  }

  if (typeof value === 'number') {
    return `${value}px`
  }

  return value || '1280px'
}

export default function PageContainer({
  children,
  maxWidth = 1280,
  disableGutters = false,
  gap = { xs: 2.5, sm: 3, md: 4 },
  contentSx = {},
  sx = {},
  ...props
}) {
  return (
    <Box
      sx={{
        width: '100%',
        px: disableGutters ? 0 : { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4, md: 5 },
        ...sx
      }}
      {...props}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: resolveMaxWidth(maxWidth),
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap,
          ...contentSx
        }}
      >
        {children}
      </Box>
    </Box>
  )
}


