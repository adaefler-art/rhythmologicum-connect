import { existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'
import DesignTokenHubClient, {
  type AssetItem,
  type TokenEntry,
  type TokenGroup,
} from './DesignTokenHubClient'

const APP_ROOT = process.cwd()
const REPO_ROOT = path.resolve(APP_ROOT, '..', '..')
const CSS_PATH = path.join(APP_ROOT, 'app', 'globals.css')

const ASSET_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp'])

const TOKEN_GROUPS = new Map<string, string>([
  ['color', 'Colors'],
  ['spacing', 'Spacing'],
  ['radius', 'Radius'],
  ['shadow', 'Shadows'],
  ['font', 'Typography'],
  ['layout', 'Layout'],
  ['other', 'Other'],
])

function extractBlock(css: string, pattern: RegExp): string {
  const match = css.match(pattern)
  return match?.[1] ?? ''
}

function parseVariables(block: string): Map<string, string> {
  const values = new Map<string, string>()
  const regex = /--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g

  for (const match of block.matchAll(regex)) {
    values.set(match[1], match[2].trim())
  }

  return values
}

function resolveGroup(name: string): string {
  if (name.startsWith('color-')) return 'color'
  if (name.startsWith('spacing-')) return 'spacing'
  if (name.startsWith('radius-')) return 'radius'
  if (name.startsWith('shadow-')) return 'shadow'
  if (name.startsWith('font-') || name.startsWith('line-height-')) return 'font'
  if (name.startsWith('layout-')) return 'layout'
  return 'other'
}

function toDataUrl(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const buffer = readFileSync(filePath)
  const mime =
    ext === '.svg'
      ? 'image/svg+xml'
      : ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : 'application/octet-stream'

  const base64 = buffer.toString('base64')
  return `data:${mime};base64,${base64}`
}

function collectAssets(rootDir: string, source: AssetItem['source']): AssetItem[] {
  if (!existsSync(rootDir)) return []
  const entries = readdirSync(rootDir, { withFileTypes: true })
  const assets: AssetItem[] = []

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      assets.push(...collectAssets(fullPath, source))
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    if (!ASSET_EXTENSIONS.has(ext)) continue

    const relativePath = path
      .relative(rootDir, fullPath)
      .split(path.sep)
      .join('/')

    assets.push({
      source,
      path: `/${relativePath}`,
      url: toDataUrl(fullPath),
      type: ext.replace('.', ''),
    })
  }

  return assets
}

function collectLucideIcons(rootDir: string): string[] {
  const icons = new Set<string>()
  if (!existsSync(rootDir)) return []
  const entries = readdirSync(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      for (const iconName of collectLucideIcons(fullPath)) {
        icons.add(iconName)
      }
      continue
    }

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) continue

    const content = readFileSync(fullPath, 'utf8')
    const matches = content.matchAll(/import\s*(type\s*)?\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)

    for (const match of matches) {
      const list = match[2].split(',')
      for (const entryName of list) {
        const cleaned = entryName.trim()
        if (!cleaned) continue
        const [iconName] = cleaned.split(/\s+as\s+/)
        if (iconName) {
          icons.add(iconName.trim())
        }
      }
    }
  }

  return Array.from(icons).sort((a, b) => a.localeCompare(b))
}

function buildTokenGroups(): TokenGroup[] {
  const css = readFileSync(CSS_PATH, 'utf8')
  const rootBlock = extractBlock(css, /:root\s*\{([\s\S]*?)\}/)
  const darkBlock = extractBlock(css, /\.dark[\s\S]*?\{([\s\S]*?)\}/)

  const baseVars = parseVariables(rootBlock)
  const darkVars = parseVariables(darkBlock)

  const grouped = new Map<string, TokenEntry[]>()

  for (const [name, value] of baseVars.entries()) {
    const groupKey = resolveGroup(name)
    const list = grouped.get(groupKey) ?? []
    list.push({
      name,
      value,
      darkValue: darkVars.get(name) ?? null,
    })
    grouped.set(groupKey, list)
  }

  return Array.from(grouped.entries())
    .map(([key, tokens]) => ({
      key,
      label: TOKEN_GROUPS.get(key) ?? key,
      tokens: tokens.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export default async function DesignTokenHubPage() {
  const tokenGroups = buildTokenGroups()

  const patientPublic = path.join(APP_ROOT, 'public')
  const studioPublic = path.join(REPO_ROOT, 'apps', 'rhythm-studio-ui', 'public')

  const assets = [
    ...collectAssets(patientPublic, 'patient'),
    ...collectAssets(studioPublic, 'studio'),
  ]

  const lucideIcons = collectLucideIcons(path.join(APP_ROOT, 'app'))

  return (
    <DesignTokenHubClient
      tokenGroups={tokenGroups}
      assets={assets}
      lucideIcons={lucideIcons}
    />
  )
}
