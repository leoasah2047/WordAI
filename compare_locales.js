import fs from 'fs'
import path from 'path'

const localesDir = 'src/i18n/locales'
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))
const otherLocales = ['zh-cn.json', 'fr.json']

otherLocales.forEach(file => {
  const localePath = path.join(localesDir, file)
  if (!fs.existsSync(localePath)) return

  const target = JSON.parse(fs.readFileSync(localePath, 'utf8'))
  const missing = Object.keys(en).filter(k => !target[k])

  console.log(`\nLocale: ${file}`)
  if (missing.length > 0) {
    console.log(`Missing keys (${missing.length}):`)
    console.log(JSON.stringify(missing, null, 2))
  } else {
    console.log('All keys present!')
  }
})
