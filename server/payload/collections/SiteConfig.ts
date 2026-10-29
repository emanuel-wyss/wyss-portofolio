import { CollectionConfig } from 'payload';

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
      name: 'event_settings',
      type: 'group',
      admin: { description: 'Optional seasonal event schedule and visual overrides.' },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'event', type: 'select', options: ['christmas', 'newyear', 'easter', 'halloween', 'valentines', 'pride', 'swiss', 'aprilfools'] },
        { name: 'startDate', type: 'date' },
        { name: 'endDate', type: 'date' },
        { name: 'intensity', type: 'select', defaultValue: 'standard', options: ['quiet', 'standard', 'party'] },
        { name: 'announcement', type: 'text' },
        { name: 'primaryColor', type: 'text' },
        { name: 'accentColor', type: 'text' },
      ],
    },
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
      name: 'friends_links',
      type: 'array',
      labels: { singular: 'Friend / Org', plural: 'Friends & Orgs' },
      admin: {
        description: 'Curated link-list of good friends and orgs shown on the About page',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'description',
          type: 'text',
          admin: { description: 'Optional one-liner shown under the name' },
        },
        {
          name: 'category',
          type: 'select',
          defaultValue: 'friend',
          options: [
            { label: 'Friend', value: 'friend' },
            { label: 'Organisation', value: 'org' },
          ],
        },
      ],
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
