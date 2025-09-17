export type TagItem = { 
  key: string
  displayValue: string
  dbValue: string
  hasIcon?: boolean
  legacyValues?: string[] // For backward compatibility
}

export const TAG_OPTIONS: TagItem[] = [
  { key: 'all', displayValue: 'All', dbValue: 'all' },
  { key: 'viral_instagram', displayValue: 'Viral on', dbValue: 'viral_instagram', hasIcon: true, legacyValues: ['Viral on IG'] },
  { key: 'navratri', displayValue: 'Navratri Special', dbValue: 'navratri', legacyValues: ['Navratri Special'] },
  { key: 'family', displayValue: 'Family', dbValue: 'family', legacyValues: ['Family'] },
  { key: 'couple', displayValue: 'Couple', dbValue: 'couple', legacyValues: ['Couple'] },
  { key: 'traditional', displayValue: 'Traditional', dbValue: 'traditional', legacyValues: ['Traditional'] },
  { key: 'vintage', displayValue: 'Vintage/Retro', dbValue: 'vintage', legacyValues: ['Vintage/Retro'] },
  { key: 'korean', displayValue: 'Korean', dbValue: 'korean', legacyValues: ['Korean'] },
  { key: 'creative', displayValue: 'Creative', dbValue: 'creative', legacyValues: ['Creative'] },
]

export const MAX_VISIBLE_TAGS = 8
