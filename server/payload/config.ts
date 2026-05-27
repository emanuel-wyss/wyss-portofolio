import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { slateEditor } from '@payloadcms/richtext-slate';
import { s3Storage } from '@payloadcms/storage-s3';

import { Posts } from './collections/Posts';
import { Gallery } from './collections/Gallery';
import { Snippets } from './collections/Snippets';
import { Media } from './collections/Media';
import { SiteConfig } from './collections/SiteConfig';

const r2Enabled = Boolean(process.env.R2_ACCOUNT_ID);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',

  admin: {
    user: 'users',
  },

  collections: [Posts, Gallery, Snippets, Media, SiteConfig],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/portfolio',
    },
  }),

  editor: slateEditor({}),

  plugins: [
    ...(r2Enabled
      ? [
          s3Storage({
            bucket: process.env.R2_BUCKET || 'portfolio-media',
            collections: {
              media: {
                generateFileURL: ({ filename }) =>
                  `${process.env.R2_BASE_URL || 'https://r2.wyss.rocks'}/${filename}`,
              },
            },
            config: {
              endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
              region: 'auto',
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],

  csrf: [
    'https://wyss.rocks',
    'https://www.wyss.rocks',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  cors: ['https://wyss.rocks', 'https://www.wyss.rocks', 'http://localhost:3000'],

  telemetry: false,
});
