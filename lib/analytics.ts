import { track } from '@vercel/analytics'

// Event tracking functions for comprehensive analytics
export const analytics = {
  // Page views and navigation
  pageView: (page: string) => {
    track('page_view', { page })
  },

  // Search and filtering
  search: (query: string, resultsCount: number) => {
    track('search', { 
      query, 
      results_count: resultsCount,
      timestamp: new Date().toISOString()
    })
  },

  filterByTag: (tag: string) => {
    track('filter_tag', { 
      tag,
      timestamp: new Date().toISOString()
    })
  },

  filterByType: (type: string) => {
    track('filter_type', { 
      type,
      timestamp: new Date().toISOString()
    })
  },

  // Style interactions
  viewStyle: (styleId: string, styleName: string) => {
    track('style_view', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  likeStyle: (styleId: string, styleName: string) => {
    track('style_like', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  unlikeStyle: (styleId: string, styleName: string) => {
    track('style_unlike', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  saveStyle: (styleId: string, styleName: string) => {
    track('style_save', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  unsaveStyle: (styleId: string, styleName: string) => {
    track('style_unsave', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  copyPrompt: (styleId: string, styleName: string) => {
    track('prompt_copy', { 
      style_id: styleId,
      style_name: styleName,
      timestamp: new Date().toISOString()
    })
  },

  shareStyle: (styleId: string, styleName: string, method: 'web_share' | 'clipboard') => {
    track('style_share', { 
      style_id: styleId,
      style_name: styleName,
      method,
      timestamp: new Date().toISOString()
    })
  },

  // Style creation and submission
  openCreateModal: () => {
    track('create_modal_open', { timestamp: new Date().toISOString() })
  },

  createStyle: (styleName: string, category: string, peopleType: string) => {
    track('style_create', { 
      style_name: styleName,
      category,
      people_type: peopleType,
      timestamp: new Date().toISOString()
    })
  },

  openSubmissionModal: () => {
    track('submission_modal_open', { timestamp: new Date().toISOString() })
  },

  submitPrompt: (title: string, hasImage: boolean) => {
    track('prompt_submit', { 
      title,
      has_image: hasImage,
      timestamp: new Date().toISOString()
    })
  },

  submitSuggestion: (title: string) => {
    track('suggestion_submit', { 
      title,
      timestamp: new Date().toISOString()
    })
  },

  // UI interactions
  toggleTheme: (theme: 'light' | 'dark') => {
    track('theme_toggle', { 
      theme,
      timestamp: new Date().toISOString()
    })
  },

  toggleSidebar: (collapsed: boolean) => {
    track('sidebar_toggle', { 
      collapsed,
      timestamp: new Date().toISOString()
    })
  },

  // Error tracking
  error: (error: string, context: string) => {
    track('error', { 
      error,
      context,
      timestamp: new Date().toISOString()
    })
  },

  // Performance tracking
  pageLoad: (page: string, loadTime: number) => {
    track('page_load', { 
      page,
      load_time: loadTime,
      timestamp: new Date().toISOString()
    })
  },

  // User engagement
  scrollDepth: (page: string, depth: number) => {
    track('scroll_depth', { 
      page,
      depth,
      timestamp: new Date().toISOString()
    })
  },

  timeOnPage: (page: string, timeSpent: number) => {
    track('time_on_page', { 
      page,
      time_spent: timeSpent,
      timestamp: new Date().toISOString()
    })
  }
}

// Hook for easy analytics usage in components
export const useAnalytics = () => {
  return analytics
}
