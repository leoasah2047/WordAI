import { Message } from '@langchain/core/messages'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

import { getMessageText } from '@/composables/useChatHistory'

const md = new MarkdownIt()
export const renderMarkdown = (text: string) => DOMPurify.sanitize(md.render(text))

export const THINK_TAG = '<think>'
export const THINK_TAG_END = '</think>'
export const IMAGE_TAG_START = '<<<IMAGE_GENERATED>>>'
export const IMAGE_TAG_END = '<<<END_IMAGE>>>'
export const ACTION_TAG_START = '<<<ACTION:'
export const ACTION_TAG_END = '>>>'

export interface RenderSegment {
  type: 'text' | 'think' | 'image' | 'action'
  text: string
  data?: any
}

export const cleanMessageText = (msg: Message): string => {
  const raw = getMessageText(msg)
  const regex = new RegExp(`${THINK_TAG}[\\s\\S]*?${THINK_TAG_END}`, 'g')
  return raw.replace(regex, '').trim()
}

export const splitThinkSegments = (text: string): RenderSegment[] => {
  const segments: RenderSegment[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    const thinkStart = text.indexOf(THINK_TAG, currentIndex)

    if (thinkStart === -1) {
      if (currentIndex < text.length) {
        segments.push({ type: 'text', text: text.slice(currentIndex) })
      }
      break
    }

    if (thinkStart > currentIndex) {
      segments.push({ type: 'text', text: text.slice(currentIndex, thinkStart) })
    }

    const thinkEnd = text.indexOf(THINK_TAG_END, thinkStart)
    if (thinkEnd === -1) {
      segments.push({ type: 'think', text: text.slice(thinkStart + THINK_TAG.length) })
      break
    }

    segments.push({ type: 'think', text: text.slice(thinkStart + THINK_TAG.length, thinkEnd) })
    currentIndex = thinkEnd + THINK_TAG_END.length
  }

  return segments
}

export const splitActionSegments = (text: string): RenderSegment[] => {
  const segments: RenderSegment[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    const start = text.indexOf(ACTION_TAG_START, currentIndex)

    if (start === -1) {
      if (currentIndex < text.length) {
        segments.push({ type: 'text', text: text.slice(currentIndex) })
      }
      break
    }

    if (start > currentIndex) {
      segments.push({ type: 'text', text: text.slice(currentIndex, start) })
    }

    const end = text.indexOf(ACTION_TAG_END, start)
    if (end === -1) {
      segments.push({ type: 'text', text: text.slice(start) })
      break
    }

    const jsonStr = text.slice(start + ACTION_TAG_START.length, end)
    try {
      const data = JSON.parse(jsonStr)
      segments.push({ type: 'action', text: '', data })
    } catch (e) {
      console.error('Failed to parse action data', e)
      segments.push({ type: 'text', text: text.slice(start, end + ACTION_TAG_END.length) })
    }

    currentIndex = end + ACTION_TAG_END.length
  }

  return segments
}

export const splitImageSegments = (text: string): RenderSegment[] => {
  const segments: RenderSegment[] = []
  let currentIndex = 0

  while (currentIndex < text.length) {
    const imgStart = text.indexOf(IMAGE_TAG_START, currentIndex)

    if (imgStart === -1) {
      if (currentIndex < text.length) {
        segments.push({ type: 'text', text: text.slice(currentIndex) })
      }
      break
    }

    if (imgStart > currentIndex) {
      segments.push({ type: 'text', text: text.slice(currentIndex, imgStart) })
    }

    const imgEnd = text.indexOf(IMAGE_TAG_END, imgStart)
    if (imgEnd === -1) {
      segments.push({ type: 'text', text: text.slice(imgStart) })
      break
    }

    const jsonStr = text.slice(imgStart + IMAGE_TAG_START.length, imgEnd)
    try {
      const data = JSON.parse(jsonStr)
      segments.push({ type: 'image', text: '', data })
    } catch (e) {
      console.error('Failed to parse image data', e)
      segments.push({ type: 'text', text: '[Image Data Error]' })
    }

    currentIndex = imgEnd + IMAGE_TAG_END.length
  }

  return segments
}

export const renderSegments = (msg: Message): RenderSegment[] => {
  const thinkSegments = splitThinkSegments(getMessageText(msg))
  const thoughtAndActionSegments: RenderSegment[] = []

  for (const seg of thinkSegments) {
    if (seg.type === 'text') {
      thoughtAndActionSegments.push(...splitActionSegments(seg.text))
    } else {
      thoughtAndActionSegments.push(seg)
    }
  }

  const finalSegments: RenderSegment[] = []

  for (const seg of thoughtAndActionSegments) {
    if (seg.type === 'text') {
      finalSegments.push(...splitImageSegments(seg.text))
    } else {
      finalSegments.push(seg)
    }
  }
  return finalSegments
}

export const getCitations = (msg: Message): string[] => {
  const text = getMessageText(msg)
  const urlRegex = /https?:\/\/[^\s)\]]+/g
  const matches = text.match(urlRegex)
  if (!matches) return []
  return [...new Set(matches)].slice(0, 5)
}
