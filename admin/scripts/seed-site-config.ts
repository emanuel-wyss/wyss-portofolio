import { getPayload } from 'payload'
import config from '../payload.config.ts'

const payload = await getPayload({ config })

await payload.create({
  collection: 'site-config',
  data: {
    siteName: 'Wyss.rocks',
    seo: {
      metaDescription: 'Full-stack developer, designer, and builder. Building beautiful, functional web experiences.',
    },
  },
})

console.log('Site config created successfully')
process.exit(0)
