#!/usr/bin/env node

const fsp = require('fs/promises')
const path = require('path')

function parseArgs(argv) {
  const args = {
    inputBundle: undefined,
    inputRanking: undefined,
    outFile: undefined,
    allowlistPath: undefined,
    method: 'template',
    sectionKeys: undefined,
  }

  let allowlistRequested = false
  let allowlistExplicitPath = null

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--bundle') {
      if (i + 1 < argv.length) {
        args.inputBundle = argv[++i]
      }
    } else if (a === '--ranking') {
      if (i + 1 < argv.length) {
        args.inputRanking = argv[++i]
      }
    } else if (a === '--out') {
      if (i + 1 < argv.length) {
        args.outFile = argv[++i]
      }
    } else if (a === '--method') {
      if (i + 1 < argv.length) {
        args.method = argv[++i]
      }
    } else if (a === '--sections') {
      if (i + 1 < argv.length) {
        args.sectionKeys = argv[++i].split(',')
      }
    } else if (a === '--allowlist') {
      allowlistRequested = true
      const next = i + 1 < argv.length ? argv[i + 1] : undefined
      if (next && !String(next).startsWith('-')) {
        allowlistExplicitPath = next
        i += 1
      }
    }
  }

  if (allowlistRequested) {
    const outDir = args.outFile ? path.dirname(args.outFile) : process.cwd()
    args.allowlistPath = allowlistExplicitPath
      ? allowlistExplicitPath
      : path.join(outDir, 'generator-allowlist.json')
  }

  return args
}

async function readAllowlist(allowlistPath) {
  if (!allowlistPath) {
    return { allowedSections: new Set() }
  }

  try {
    const raw = await fsp.readFile(allowlistPath, 'utf8')
    const json = JSON.parse(raw)
    const allowedSections = Array.isArray(json.allowedSections) ? json.allowedSections : []
    return {
      allowedSections: new Set(allowedSections.map(String)),
    }
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      try {
        await fsp.mkdir(path.dirname(allowlistPath), { recursive: true })
        await fsp.writeFile(
          allowlistPath,
          `${JSON.stringify({ allowedSections: [] }, null, 2)}\n`,
          'utf8',
        )
      } catch {
        // If we can't create it (permissions, etc), still treat as empty.
      }
      return { allowedSections: new Set() }
    }
    throw e
  }
}

async function generateSectionsSync(context, options) {
  // Simulate the generator behavior deterministically
  // This is a simplified version for CLI testing
  const sectionKeys = options.sectionKeys || ['overview', 'risk-summary']
  const sections = []

  for (const key of sectionKeys) {
    sections.push({
      sectionKey: key,
      inputs: {
        riskBundleId: context.riskBundle.assessmentId,
        rankingId: context.ranking?.jobId,
        programTier: context.programTier,
        scores: { risk: context.riskBundle.riskScore.overall },
        signals: [`risk_level_${context.riskBundle.riskScore.riskLevel}`],
      },
      draft: generateTemplateContent(context, key),
      promptVersion: 'v1.0.0',
      modelConfig: undefined,
      generationMethod: options.method || 'template',
      generatedAt: new Date().toISOString(),
    })
  }

  return {
    sectionsVersion: 'v1',
    jobId: context.jobId,
    riskBundleId: context.riskBundle.assessmentId,
    rankingId: context.ranking?.jobId,
    programTier: context.programTier,
    sections,
    generatedAt: new Date().toISOString(),
    metadata: {
      generationTimeMs: 0,
      llmCallCount: 0,
      fallbackCount: 0,
    },
  }
}

function generateTemplateContent(context, sectionKey) {
  const { riskBundle, ranking, programTier } = context
  const riskScore = riskBundle.riskScore.overall
  const riskLevel = riskBundle.riskScore.riskLevel

  switch (sectionKey) {
    case 'overview':
      return `Basierend auf Ihrem Assessment liegt Ihr Risiko-Score bei ${riskScore} von 100 (Stufe: ${riskLevel}). ${programTier ? `Ihr Programm-Tier: ${programTier}. ` : ''}Diese Übersicht dient nur zur Information und ersetzt keine medizinische Beratung.`

    case 'risk-summary':
      let content = `**Risiko-Zusammenfassung**\n\nGesamt-Score: ${riskScore}/100\nRisiko-Level: ${riskLevel}\n\n`
      if (riskBundle.riskScore.factors && riskBundle.riskScore.factors.length > 0) {
        content += '**Faktoren:**\n'
        const sortedFactors = [...riskBundle.riskScore.factors].sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return a.key.localeCompare(b.key)
        })
        for (const factor of sortedFactors) {
          content += `- ${factor.key}: ${factor.score}\n`
        }
      }
      return content

    case 'recommendations':
      if (ranking && ranking.topInterventions.length > 0) {
        let content = '**Empfohlene Maßnahmen**\n\n'
        const sortedInterventions = [...ranking.topInterventions].sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
          return a.topic.topicId.localeCompare(b.topic.topicId)
        })
        for (const intervention of sortedInterventions.slice(0, 5)) {
          content += `${intervention.rank}. ${intervention.topic.topicLabel} (Priorität: ${intervention.priorityScore})\n`
        }
        return content
      }
      return 'Keine spezifischen Empfehlungen verfügbar.'

    case 'top-interventions':
      if (ranking && ranking.topInterventions.length > 0) {
        let content = '**Top-Interventionen**\n\n'
        const sortedTopInterventions = [...ranking.topInterventions].sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
          return a.topic.topicId.localeCompare(b.topic.topicId)
        })
        for (const intervention of sortedTopInterventions.slice(0, 3)) {
          content += `${intervention.rank}. ${intervention.topic.topicLabel}\n`
          content += `   - Priorität: ${intervention.priorityScore}/100\n`
          content += `   - Säule: ${intervention.topic.pillarKey}\n\n`
        }
        return content
      }
      return 'Keine Interventionen verfügbar.'

    default:
      return 'Inhalt für diesen Abschnitt wird erstellt.'
  }
}

async function generate({ inputBundle, inputRanking, outFile, allowlistPath, method, sectionKeys }) {
  if (!inputBundle) {
    throw new Error('Missing required argument: --bundle')
  }

  if (!outFile) {
    throw new Error('Missing required argument: --out')
  }

  const allowlist = await readAllowlist(allowlistPath)

  // Log allowlist status
  if (allowlistPath) {
    console.log(`Allowlist: enabled (${allowlistPath})`)
  } else {
    console.log('Allowlist: disabled')
  }

  // Note: allowlist is loaded for future filtering functionality
  // Currently sections are generated without filtering
  void allowlist

  const bundleData = JSON.parse(await fsp.readFile(inputBundle, 'utf8'))
  const rankingData = inputRanking
    ? JSON.parse(await fsp.readFile(inputRanking, 'utf8'))
    : undefined

  const context = {
    jobId: bundleData.jobId || 'cli-job-' + Date.now(),
    riskBundle: bundleData,
    ranking: rankingData,
    programTier: bundleData.programTier,
    algorithmVersion: bundleData.algorithmVersion,
    funnelVersion: bundleData.funnelVersion,
  }

  const options = {
    method: method || 'template',
    sectionKeys: sectionKeys || undefined,
  }

  const result = await generateSectionsSync(context, options)

  await fsp.mkdir(path.dirname(outFile), { recursive: true })
  await fsp.writeFile(outFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8')

  console.log(`✅ Generated sections written to ${outFile}`)
  console.log(`Sections: ${result.sections.length}`)
}

async function main() {
  const args = parseArgs(process.argv)

  await generate(args)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
