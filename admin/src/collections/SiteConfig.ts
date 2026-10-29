import type { GlobalConfig } from 'payload';

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'Site Config',
  admin: {
    hideAPIURL: true,
  },
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Site Identity & CV',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              defaultValue: 'Wyss.rocks',
            },
            {
              name: 'cv_url',
              type: 'relationship',
              relationTo: 'media',
              admin: {
                description: 'PDF file of CV/Resume',
              },
            },
          ],
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
      ],
    },
    {
      type: 'collapsible',
      label: 'Social Links & Good Friends / Orgs',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'social_links',
          type: 'array',
          admin: {
            description: 'Social media links displayed on the About page and footer',
          },
          fields: [
            {
              type: 'row',
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
                    description: 'Icon class or name (e.g., "github")',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'friends_links',
          type: 'array',
          labels: { singular: 'Friend / Org', plural: 'Friends & Orgs' },
          admin: {
            description: 'Curated link-list of good friends and orgs shown on the About page',
          },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
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
              name: 'description',
              type: 'text',
              admin: { description: 'Optional one-liner shown under the name' },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Seasonal Events & Live Preview',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'event_settings',
          type: 'group',
          admin: { description: 'Optional seasonal event schedule and visual overrides.' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                {
                  name: 'event',
                  type: 'select',
                  options: [
                    'christmas',
                    'newyear',
                    'easter',
                    'halloween',
                    'valentines',
                    'pride',
                    'swiss',
                    'aprilfools',
                  ],
                },
                {
                  name: 'intensity',
                  type: 'select',
                  defaultValue: 'standard',
                  options: ['quiet', 'standard', 'party'],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'startDate', type: 'date' },
                { name: 'endDate', type: 'date' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'announcement', type: 'text' },
                { name: 'primaryColor', type: 'text' },
                { name: 'accentColor', type: 'text' },
              ],
            },
          ],
        },
        {
          name: 'eventPreview',
          type: 'ui',
          admin: {
            components: {
              Field: '@/components/EventPreviewField#EventPreviewField',
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'SEO & Metadata',
      admin: { initCollapsed: false },
      fields: [
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
              type: 'row',
              fields: [
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
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Deployment Telemetry',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'deploymentDashboard',
          type: 'ui',
          admin: {
            components: {
              Field: '@/components/DeploymentDashboardField#DeploymentDashboardField',
            },
          },
        },
      ],
    },
  ],
};
