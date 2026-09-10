import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'public/logoweparty.png')
const out = n => resolve(root, 'public', n)

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

async function makeSquarePng (size, file, padRatio) {
  const inner = Math.round(size * (1 - padRatio))
  const logo = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: transparent })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: transparent },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(out(file))
  console.log('gerado', file)
}

await makeSquarePng(32, 'favicon-32x32.png', 0.08)
await makeSquarePng(16, 'favicon-16x16.png', 0.06)

// Base para o favicon.svg: PNG quadrado 256x256 embutido como data URI
const svgBaseSize = 256
const svgLogo = await sharp(src)
  .resize(Math.round(svgBaseSize * 0.94), Math.round(svgBaseSize * 0.94), { fit: 'contain', background: transparent })
  .toBuffer()
const svgSquare = await sharp({
  create: { width: svgBaseSize, height: svgBaseSize, channels: 4, background: transparent },
})
  .composite([{ input: svgLogo, gravity: 'center' }])
  .png()
  .toBuffer()

const base64 = svgSquare.toString('base64')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgBaseSize} ${svgBaseSize}" width="${svgBaseSize}" height="${svgBaseSize}">
  <image href="data:image/png;base64,${base64}" width="${svgBaseSize}" height="${svgBaseSize}" />
</svg>
`
const fs = await import('node:fs/promises')
await fs.writeFile(out('favicon.svg'), svg, 'utf8')
console.log('gerado favicon.svg', (svg.length / 1024).toFixed(1), 'KB')
