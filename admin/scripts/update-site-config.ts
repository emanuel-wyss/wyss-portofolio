import { getPayload } from 'payload'
import config from '../payload.config.ts'

const payload = await getPayload({ config })

// Find the existing site-config
const { docs } = await payload.find({ collection: 'site-config', limit: 1 })

if (!docs.length) {
  console.error('No site-config found. Run seed-site-config.ts first.')
  process.exit(1)
}

const id = docs[0].id

// Update fields as needed
const updated = await payload.update({
  collection: 'site-config',
  id,
  data: {
    siteName: 'wyss.rocks',
    tagline: 'Portfolio of Maenu',
    description: 'Portfolio and personal projects from Maenu',
    seo: {
      metaDescription: 'Portfolio and personal projects from Maenu',
    },
  },
})

console.log('Site config updated:', updated.siteName)
process.exit(0)
