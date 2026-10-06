import { defineStore } from 'pinia'
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase'

export const useApplicationStore = defineStore('application', {
  state: () => {
    const savedList = localStorage.getItem('autoapply_applications_list')
    return {
      // Current active workspace for a job
      currentJob: {
        screenshotDataUrl: '',
        companyName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        salary: '',
        deadline: '',
        requirements: [],
        responsibilities: [],
        skillsRequired: [],
        summary: '',
        rawText: '',
        availablePositions: [],
        // Tailored contents
        tailoredCoverLetter: '',
        coverLetterParagraph1: '',
        coverLetterParagraph2: '',
        tailoredEmailSubject: '',
        tailoredWhatsAppMessage: '',
        tailoredProfessionalSummary: '',
        highlightedSkills: [],
        selectedPortfolioIds: []
      },
      isScanning: false,
      isTailoring: false,
      applications: savedList ? JSON.parse(savedList) : []
    }
  },

  actions: {
    setScanning(val) {
      this.isScanning = Boolean(val)
    },

    setTailoring(val) {
      this.isTailoring = Boolean(val)
    },

    setScreenshot(dataUrl) {
      this.currentJob.screenshotDataUrl = dataUrl
    },

    setDetectedJob(data) {
      if (!data) return
      this.currentJob.companyName = data.companyName || this.currentJob.companyName
      this.currentJob.jobTitle = data.jobTitle || this.currentJob.jobTitle
      this.currentJob.email = data.email || this.currentJob.email
      this.currentJob.phone = data.phone || this.currentJob.phone
      this.currentJob.location = data.location || this.currentJob.location
      this.currentJob.salary = data.salary || this.currentJob.salary
      this.currentJob.deadline = data.deadline || this.currentJob.deadline
      this.currentJob.requirements = Array.isArray(data.requirements) ? data.requirements : []
      this.currentJob.responsibilities = Array.isArray(data.responsibilities) ? data.responsibilities : []
      this.currentJob.skillsRequired = Array.isArray(data.skillsRequired) ? data.skillsRequired : []
      this.currentJob.summary = data.summary || ''
      this.currentJob.rawText = data.rawText || ''
      this.currentJob.availablePositions = Array.isArray(data.availablePositions) ? data.availablePositions : (data.jobTitle ? [data.jobTitle] : [])
    },

    setCurrentJobData(data) {
      this.setDetectedJob(data)
    },

    updateTailoredData(tailored) {
      if (!tailored) return
      this.currentJob.tailoredCoverLetter = tailored.tailoredCoverLetter || tailored.coverLetter || this.currentJob.tailoredCoverLetter
      if (tailored.coverLetterParagraph1) {
        this.currentJob.coverLetterParagraph1 = tailored.coverLetterParagraph1
      }
      if (tailored.coverLetterParagraph2) {
        this.currentJob.coverLetterParagraph2 = tailored.coverLetterParagraph2
      }
      this.currentJob.tailoredEmailSubject = tailored.tailoredEmailSubject || tailored.emailSubject || this.currentJob.tailoredEmailSubject
      this.currentJob.tailoredWhatsAppMessage = tailored.tailoredWhatsAppMessage || tailored.whatsAppMessage || this.currentJob.tailoredWhatsAppMessage
      this.currentJob.tailoredProfessionalSummary = tailored.tailoredProfessionalSummary || tailored.professionalSummary || this.currentJob.tailoredProfessionalSummary
      
      if (tailored.recommendedSkills || tailored.highlightedSkills) {
        this.currentJob.highlightedSkills = tailored.recommendedSkills || tailored.highlightedSkills
      }

      if (tailored.recommendedPortfolioIds) {
        this.currentJob.selectedPortfolioIds = tailored.recommendedPortfolioIds
      }
    },

    setTailoredData(tailored) {
      this.updateTailoredData(tailored)
    },

    togglePortfolioSelection(portfolioId) {
      const idx = this.currentJob.selectedPortfolioIds.indexOf(portfolioId)
      if (idx > -1) {
        this.currentJob.selectedPortfolioIds.splice(idx, 1)
      } else {
        this.currentJob.selectedPortfolioIds.push(portfolioId)
      }
    },

    saveCurrentToTracker(customStatus = 'Applied', channel = 'manual') {
      return this.saveApplicationToHistory(channel, customStatus)
    },

    saveApplicationToHistory(channel = 'manual', customStatus = 'Applied') {
      const item = {
        id: 'app-' + Date.now(),
        companyName: this.currentJob.companyName || 'Perusahaan',
        positionTitle: this.currentJob.jobTitle || 'Posisi',
        contactEmail: this.currentJob.email,
        contactPhone: this.currentJob.phone,
        location: this.currentJob.location,
        salary: this.currentJob.salary,
        status: customStatus, // 'Draft', 'Applied', 'Interview', 'Rejected', 'Offered'
        appliedAt: new Date().toISOString(),
        channelUsed: channel, // 'gmail', 'whatsapp', 'website', 'manual'
        tailoredCoverLetter: this.currentJob.tailoredCoverLetter,
        tailoredEmailSubject: this.currentJob.tailoredEmailSubject,
        tailoredWhatsAppMessage: this.currentJob.tailoredWhatsAppMessage,
        requirements: this.currentJob.requirements,
        selectedPortfolioIds: [...this.currentJob.selectedPortfolioIds],
        notes: ''
      }

      this.applications.unshift(item)
      this.persist()

      // Also sync to Supabase if configured
      this.syncApplicationToSupabase(item)

      return item
    },

    updateApplicationStatus(id, newStatus) {
      const app = this.applications.find(a => a.id === id)
      if (app) {
        app.status = newStatus
        this.persist()
      }
    },

    deleteApplication(id) {
      this.applications = this.applications.filter(a => a.id !== id)
      this.persist()
    },

    updateApplicationNotes(id, notes) {
      const app = this.applications.find(a => a.id === id)
      if (app) {
        app.notes = notes
        this.persist()
      }
    },

    persist() {
      localStorage.setItem('autoapply_applications_list', JSON.stringify(this.applications))
    },

    async syncApplicationToSupabase(appItem) {
      const client = getSupabaseClient()
      if (!client) return

      try {
        await client.from('applications').insert({
          company_name: appItem.companyName,
          position_title: appItem.positionTitle,
          contact_email: appItem.contactEmail,
          contact_phone: appItem.contactPhone,
          status: appItem.status,
          channel_used: appItem.channelUsed,
          tailored_cover_letter: appItem.tailoredCoverLetter,
          requirements: appItem.requirements,
          applied_at: appItem.appliedAt,
          notes: appItem.notes
        })
      } catch (err) {
        console.warn('Could not sync application to Supabase:', err)
      }
    },

    clearCurrentJob() {
      this.currentJob = {
        screenshotDataUrl: '',
        companyName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        salary: '',
        deadline: '',
        requirements: [],
        responsibilities: [],
        skillsRequired: [],
        summary: '',
        rawText: '',
        tailoredCoverLetter: '',
        tailoredEmailSubject: '',
        tailoredWhatsAppMessage: '',
        tailoredProfessionalSummary: '',
        highlightedSkills: [],
        selectedPortfolioIds: []
      }
    }
  }
})
