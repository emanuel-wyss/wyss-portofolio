import { NotFoundPage } from '@payloadcms/next/views'
import React from 'react'
import config from '@payload-config'

export default function NotFound() {
  return <NotFoundPage config={config} params={Promise.resolve({ segments: [] })} />
}
