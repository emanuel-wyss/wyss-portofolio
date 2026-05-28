import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';

import { Posts } from './collections/Posts';
import { Gallery } from './collections/Gallery';
import { Snippets } from './collections/Snippets';
import { Media } from './collections/Media';
import { SiteConfig } from './collections/SiteConfig';
import { Users } from './collections/Users';

const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() || '';
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() || '';
const r2SecretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY?.trim() ||
  process.env.R2_SECRET_ACCESS_TOKEN?.trim() || '';
const r2Bucket = process.env.R2_BUCKET?.trim() || 'wyss-portfolio';
const r2BaseUrl = process.env.R2_BASE_URL?.trim() || 'https://media.wyss.rocks';

// R2 S3 API requires accessKeyId + secretAccessKey; accessKeyId is 32 chars.
const r2Enabled = Boolean(
  r2AccountId &&
    r2AccessKeyId &&
    r2AccessKeyId.length === 32 &&
    r2SecretAccessKey
);

if (r2AccountId && !r2Enabled) {
  console.warn(
    '[payload] R2 config is incomplete or invalid. Expected R2_ACCESS_KEY_ID (32 chars) and R2_SECRET_ACCESS_KEY. S3 storage plugin disabled.'
  );
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me',

  admin: {
    user: 'users',
  },

  collections: [Users, Posts, Gallery, Snippets, Media, SiteConfig],

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/portfolio',
    },
  }),

  editor: lexicalEditor({}),

  plugins: [
    ...(r2Enabled
      ? [
          s3Storage({
            bucket: r2Bucket,
            collections: {
              media: {
                generateFileURL: ({ filename }) =>
                  `${r2BaseUrl}/${filename}`,
              },
            },
            config: {
              endpoint: `https://${r2AccountId}.eu.r2.cloudflarestorage.com`,
              region: 'auto',
              credentials: {
                accessKeyId: r2AccessKeyId,
                secretAccessKey: r2SecretAccessKey,
              },
            },
          }),
        ]
      : []),
  ],

  csrf: [
    'https://wyss.rocks',
    'https://www.wyss.rocks',
    'https://web-production-3e6e0.up.railway.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ],

  cors: [
    'https://wyss.rocks',
    'https://www.wyss.rocks',
    'https://web-production-3e6e0.up.railway.app',
    'http://localhost:3000',
  ],

  telemetry: false,
});
