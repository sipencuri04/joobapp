// Unified AI Manager (Supports both Google Gemini & Groq LPU API)

import { analyzeJobScreenshot, tailorApplicationDocuments, getMockJobData } from './gemini'
import { analyzeJobScreenshotWithGroq, tailorApplicationDocumentsWithGroq } from './groq'
import { useSettingsStore } from '../stores/settings'

/**
 * Scan job vacancy screenshot with active AI provider (Groq or Gemini)
 */
export async function executeJobScan(imageBase64) {
  const settings = useSettingsStore()
  const provider = settings.effectiveAiProvider

  if (provider === 'groq') {
    try {
      return await analyzeJobScreenshotWithGroq(imageBase64, settings.groqApiKey)
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
        return await analyzeJobScreenshotWithGroq(imageBase64, settings.groqApiKey)
      }
      throw geminiErr
    }
  }

  // Fallback demo mock
  return getMockJobData()
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
        settings.groqApiKey
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
          settings.groqApiKey
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
