import { CollectionConfig } from 'payload';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'featured'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly slug (auto-generated from title)',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Short description for previews and meta tags',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'featured_image',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'Featured image for the post',
      },
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Design', value: 'design' },
        { label: 'Business', value: 'business' },
        { label: 'Personal', value: 'personal' },
      ],
      admin: {
        description: 'Post category for filtering',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'Publication date',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'updatedAt',
      type: 'date',
      admin: {
        description: 'Last update date',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
          admin: {
            description: 'SEO meta description (max 160 chars)',
          },
        },
        {
          name: 'ogImage',
          type: 'relationship',
          relationTo: 'media',
          admin: {
            description: 'Open Graph image for social sharing',
          },
        },
        {
          name: 'canonical',
          type: 'text',
          admin: {
            description: 'Canonical URL (optional)',
          },
        },
      ],
    },
  ],
};
