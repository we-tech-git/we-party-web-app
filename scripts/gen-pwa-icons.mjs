import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(root, 'public/logoweparty.png')
const out = (n) => resolve(root, 'public', n)

// Fundo claro da marca para os ícones "any"; fundo gradiente sólido p/ maskable
async function make(size, file, { bg, padRatio }) {
  const inner = Math.round(size * (1 - padRatio))
  const logo = await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(out(file))
  console.log('gerado', file)
}

const light = { r: 255, g: 245, b: 245, alpha: 1 } // #fff5f5
const brand = { r: 255, g: 183, b: 77, alpha: 1 }  // #FFB74D
const transparent = { r: 0, g: 0, b: 0, alpha: 0 }

await make(192, 'pwa-192x192.png', { bg: transparent, padRatio: 0.12 })
await make(512, 'pwa-512x512.png', { bg: transparent, padRatio: 0.12 })
await make(512, 'pwa-maskable-512x512.png', { bg: brand, padRatio: 0.28 })
await make(180, 'apple-touch-icon.png', { bg: light, padRatio: 0.12 })
await make(64, 'pwa-64x64.png', { bg: transparent, padRatio: 0.1 })
console.log('OK')
