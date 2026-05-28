import type { CollectionConfig } from 'payload';

export const SiteConfig: CollectionConfig = {
  slug: 'site-config',
  admin: {
    useAsTitle: 'siteName',
    hideAPIURL: true,
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      defaultValue: 'Wyss.rocks',
    },
    {
      name: 'tagline',
      type: 'textarea',
      defaultValue: 'Full-stack developer, designer, and builder',
    },
    {
      name: 'description',
      type: 'textarea',
      defaultValue: 'Building beautiful, functional web experiences',
    },
    {
      name: 'social_links',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Twitter', value: 'twitter' },
            { label: 'GitHub', value: 'github' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Discord', value: 'discord' },
            { label: 'Email', value: 'email' },
            { label: 'Website', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'icon',
          type: 'text',
          admin: {
            description: 'Icon class or name (e.g., "github", "twitter")',
          },
        },
      ],
      admin: {
        description: 'Social media links displayed in footer',
      },
    },
    {
      name: 'cv_url',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        description: 'PDF file of CV/Resume',
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
          required: true,
        },
        {
          name: 'ogImage',
          type: 'relationship',
          relationTo: 'media',
        },
        {
          name: 'twitterHandle',
          type: 'text',
          admin: {
            description: '@username without the @',
          },
        },
      ],
    },
  ],
};
