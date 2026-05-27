import { CollectionConfig } from 'payload';

export const Snippets: CollectionConfig = {
  slug: 'snippets',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'language', 'publishedAt'],
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
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'code',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Code snippet content',
      },
    },
    {
      name: 'language',
      type: 'select',
      required: true,
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'React/JSX', value: 'jsx' },
        { label: 'Python', value: 'python' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'Bash', value: 'bash' },
        { label: 'SQL', value: 'sql' },
        { label: 'JSON', value: 'json' },
        { label: 'YAML', value: 'yaml' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Utility', value: 'utility' },
        { label: 'Algorithm', value: 'algorithm' },
        { label: 'React Hook', value: 'react-hook' },
        { label: 'Configuration', value: 'config' },
        { label: 'Tips & Tricks', value: 'tips' },
      ],
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
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        {
          name: 'metaDescription',
          type: 'textarea',
          maxLength: 160,
        },
      ],
    },
  ],
};
