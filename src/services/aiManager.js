// Unified AI Manager (Supports both Google Gemini & Groq LPU API)

import { analyzeJobScreenshot, tailorApplicationDocuments, getMockJobData, analyzeJobText } from './gemini'
import { analyzeJobScreenshotWithGroq, tailorApplicationDocumentsWithGroq, analyzeJobTextWithGroq } from './groq'
import { useSettingsStore } from '../stores/settings'

/**
 * Scan job vacancy screenshot with active AI provider (Groq or Gemini)
 */
export async function executeJobScan(imageBase64) {
  const settings = useSettingsStore()
  const provider = settings.effectiveAiProvider

  if (provider === 'groq') {
    try {
      return await analyzeJobScreenshotWithGroq(imageBase64, settings.groqApiKeys)
    } catch (groqErr) {
      console.warn('Groq Vision scan failed, checking fallback to Gemini...', groqErr)
      if (settings.hasGeminiKey) {
        return await analyzeJobScreenshot(imageBase64, settings.geminiApiKey)
      }
      throw groqErr
    }
  }

  if (provider === 'gemini') {
    try {
      return await analyzeJobScreenshot(imageBase64, settings.geminiApiKey)
    } catch (geminiErr) {
      console.warn('Gemini scan failed, checking fallback to Groq...', geminiErr)
      if (settings.hasGroqKey) {
        return await analyzeJobScreenshotWithGroq(imageBase64, settings.groqApiKeys)
      }
      throw geminiErr
    }
  }

  // Fallback demo mock
  return getMockJobData()
}

/**
 * Analisis TEKS lowongan (dari link JobStreet / teks tempel) dengan provider AI aktif.
 * Mengembalikan null jika tidak ada API Key (pemanggil memakai hasil heuristik).
 */
export async function executeJobTextScan(jobText) {
  const settings = useSettingsStore()
  const provider = settings.effectiveAiProvider

  if (provider === 'groq') {
    try {
      return await analyzeJobTextWithGroq(jobText, settings.groqApiKeys)
    } catch (groqErr) {
      if (settings.hasGeminiKey) return await analyzeJobText(jobText, settings.geminiApiKey)
      throw groqErr
    }
  }
  if (provider === 'gemini') {
    try {
      return await analyzeJobText(jobText, settings.geminiApiKey)
    } catch (geminiErr) {
      if (settings.hasGroqKey) return await analyzeJobTextWithGroq(jobText, settings.groqApiKeys)
      throw geminiErr
    }
  }
  return null
}

/**
 * Tailor documents with active AI provider (Groq or Gemini)
 */
export async function executeTailorDocuments(jobInfo, applicantProfile, masterCoverLetter) {
  const settings = useSettingsStore()
  const provider = settings.effectiveAiProvider

  if (provider === 'groq') {
    try {
      return await tailorApplicationDocumentsWithGroq(
        jobInfo,
        applicantProfile,
        masterCoverLetter,
        settings.groqApiKeys
      )
    } catch (groqErr) {
      console.warn('Groq tailoring failed, checking fallback to Gemini...', groqErr)
      if (settings.hasGeminiKey) {
        return await tailorApplicationDocuments(
          jobInfo,
          applicantProfile,
          masterCoverLetter,
          settings.geminiApiKey
        )
      }
      throw groqErr
    }
  }

  if (provider === 'gemini') {
    try {
      return await tailorApplicationDocuments(
        jobInfo,
        applicantProfile,
        masterCoverLetter,
        settings.geminiApiKey
      )
    } catch (geminiErr) {
      console.warn('Gemini tailoring failed, checking fallback to Groq...', geminiErr)
      if (settings.hasGroqKey) {
        return await tailorApplicationDocumentsWithGroq(
          jobInfo,
          applicantProfile,
          masterCoverLetter,
          settings.groqApiKeys
        )
      }
      throw geminiErr
    }
  }

  // Fallback template
  return await tailorApplicationDocuments(
    jobInfo,
    applicantProfile,
    masterCoverLetter,
    ''
  )
}
