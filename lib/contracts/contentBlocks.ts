import { z } from 'zod'
import { CONTENT_BLOCK_TYPE, type ContentBlockType } from '@/lib/contracts/registry'
import { isValidUrl } from '@/lib/utils/urlSecurity'

const safeOptionalUrl = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || isValidUrl(value, false), {
    message: 'URL must use a safe protocol or relative path',
  })
  .optional()

const BaseContentBlockSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum([
    CONTENT_BLOCK_TYPE.HERO,
    CONTENT_BLOCK_TYPE.RICH_TEXT,
    CONTENT_BLOCK_TYPE.IMAGE,
    CONTENT_BLOCK_TYPE.BADGE,
    CONTENT_BLOCK_TYPE.CTA,
  ] as [ContentBlockType, ...ContentBlockType[]]),
  order: z.number().int().nonnegative().optional(),
})

const HeroBlockSchema = BaseContentBlockSchema.extend({
  type: z.literal(CONTENT_BLOCK_TYPE.HERO),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(800).optional(),
  imageUrl: safeOptionalUrl,
  imageAlt: z.string().max(200).optional(),
})

const RichTextBlockSchema = BaseContentBlockSchema.extend({
  type: z.literal(CONTENT_BLOCK_TYPE.RICH_TEXT),
  markdown: z.string().min(1),
})

const ImageBlockSchema = BaseContentBlockSchema.extend({
  type: z.literal(CONTENT_BLOCK_TYPE.IMAGE),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .refine((value) => isValidUrl(value, false), {
      message: 'Image URL must use a safe protocol or relative path',
    }),
  alt: z.string().max(200).optional(),
  caption: z.string().max(400).optional(),
})

const BadgeBlockSchema = BaseContentBlockSchema.extend({
  type: z.literal(CONTENT_BLOCK_TYPE.BADGE),
  label: z.string().min(1).max(120),
  text: z.string().max(500).optional(),
})

const CTABlockSchema = BaseContentBlockSchema.extend({
  type: z.literal(CONTENT_BLOCK_TYPE.CTA),
  label: z.string().min(1).max(120),
  href: z
    .string()
    .trim()
    .min(1)
    .refine((value) => isValidUrl(value, false), {
      message: 'CTA URL must use a safe protocol or relative path',
    }),
  openInNewTab: z.boolean().optional(),
})

export const ContentBlockSchema = z.discriminatedUnion('type', [
  HeroBlockSchema,
  RichTextBlockSchema,
  ImageBlockSchema,
  BadgeBlockSchema,
  CTABlockSchema,
])

export const ContentBlocksSchema = z.array(ContentBlockSchema)

export type ContentBlock = z.infer<typeof ContentBlockSchema>

function parseRawBlocks(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  return raw
}

export function parseContentBlocks(raw: unknown): ContentBlock[] | null {
  const parsed = parseRawBlocks(raw)
  const result = ContentBlocksSchema.safeParse(parsed)
  if (!result.success) {
    return null
  }

  return [...result.data].sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
}
