import { createI18n } from 'vue-i18n'

import { localStorageKey } from '@/utils/enum'

import en from './locales/en.json'
import fr from './locales/fr.json'
import zhCn from './locales/zh-cn.json'

const messages = {
  en,
  'zh-cn': zhCn,
  fr,
}

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem(localStorageKey.localLanguage) || 'en',
  fallbackLocale: 'zh-cn',
  messages,
})
