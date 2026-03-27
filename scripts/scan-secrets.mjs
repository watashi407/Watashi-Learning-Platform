import { promises as fs } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()

const ignoredDirectories = new Set([
  '.git',
  'dist',
  'dist-ssr',
  'node_modules',
  '.tanstack',
  '.vinxi',
  '.nitro',
  '.output',
  '.wrangler',
])

const ignoredFileNames = new Set([
  '.env',
  '.env.local',
  '.env.production',
])

const ignoredFilePatterns = [/^\.env\..+\.local$/i]

const textFileExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
])

const detectors = [
  {
    name: 'Postgres connection string',
    pattern: /\bpostgres(?:ql)?:\/\/[^\s'",`]+/gi,
  },
  {
    name: 'Supabase secret key',
    pattern: /\bsb_secret_[A-Za-z0-9_-]{16,}\b/gi,
  },
  {
    name: 'Bearer token',
    pattern: /\bBearer\s+[A-Za-z0-9._~+\/=-]{20,}\b/g,
  },
  {
    name: 'JWT-like token',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  },
  {
    name: 'Server secret env assignment',
    pattern:
      /^\s*(SUPABASE_SERVICE_ROLE_KEY|TRIGGER_SECRET_KEY|GEMINI_API_KEY|DATABASE_URL|SUPABASE_DB_URL)[ \t]*=[ \t]*([^\s\r\n][^\r\n]*)[ \t]*$/gim,
    extract(match) {
      return {
        key: match[1],
        value: match[2],
      }
    },
  },
]

const findings = []

await walk(rootDir)

if (findings.length > 0) {
  console.error('Secret scan failed. Remove the following values from committed files:')
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.name}`)
  }
  process.exitCode = 1
} else {
  console.log('Secret scan passed.')
}

async function walk(currentDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue
      }

      await walk(path.join(currentDir, entry.name))
      continue
    }

    const relativeFile = path.relative(rootDir, path.join(currentDir, entry.name))
    if (shouldIgnoreFile(entry.name, relativeFile)) {
      continue
    }

    if (!shouldScanFile(entry.name)) {
      continue
    }

    const content = await fs.readFile(path.join(currentDir, entry.name), 'utf8')
    scanFile(relativeFile, content)
  }
}

function shouldIgnoreFile(fileName, relativeFile) {
  if (ignoredFileNames.has(fileName)) {
    return true
  }

  return ignoredFilePatterns.some((pattern) => pattern.test(fileName) || pattern.test(relativeFile))
}

function shouldScanFile(fileName) {
  if (/^\.env(\..+)?$/i.test(fileName)) {
    return true
  }

  return textFileExtensions.has(path.extname(fileName).toLowerCase())
}

function scanFile(relativeFile, content) {
  for (const detector of detectors) {
    detector.pattern.lastIndex = 0
    let match
    while ((match = detector.pattern.exec(content)) !== null) {
      if (detector.extract) {
        const extracted = detector.extract(match)
        if (!isRealSecretValue(extracted.value)) {
          continue
        }
      }

      findings.push({
        file: relativeFile,
        line: getLineNumber(content, match.index),
        name: detector.name,
      })
    }
  }
}

function isRealSecretValue(rawValue) {
  const value = rawValue.trim().replace(/^['"]|['"]$/g, '')
  if (value.length === 0) {
    return false
  }

  return !/(example|placeholder|changeme|replace|your[_-]?|<.*>)/i.test(value)
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length
}
