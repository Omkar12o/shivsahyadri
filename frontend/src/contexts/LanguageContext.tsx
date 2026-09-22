import React, { createContext, useContext, useState, useEffect } from 'react'

type Lang = 'en' | 'mr'
interface LanguageContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.members': 'Members',
    'nav.aarti': 'Aarti',
    'nav.programs': 'Programs',
    'nav.meetings': 'Meetings',
    'nav.gallery': 'Gallery',
    'nav.videos': 'Videos',
    'nav.donation': 'Donation',
    'nav.contact': 'Contact',
    'nav.festival2026': '2026 Ganpati',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',
    'nav.dashboard': 'Dashboard',
    'hero.welcome': 'Shree Ganeshay Namah',
    'hero.subtitle': 'Shivsaydri Ganesh Mandal, Umarkhanchan',
    'hero.aarti': 'Aarti',
    'hero.programs': 'Programs',
    'hero.gallery': 'Gallery',
    'hero.donation': 'Donation',
    'hero.today': 'Today',
    'home.programsTitle': "Today's Program",
    'home.membersTitle': 'Our Members',
    'home.viewAll': 'View All',
    'home.aartiTitle': "Today's Aarti",
    'home.birthdayTitle': "Today's Birthdays",
    'home.announcements': 'Recent Announcements',
    'home.meetings': 'Upcoming Meetings',
    'home.gallery': 'Moments of Ganeshotsav',
    'footer.made': 'Made in 2026 with ❤️ for Shivsaydri Mandal',
    'footer.rights': 'All rights reserved.',
    'festival.title': 'Ganpati Festival 2026',
    'festival.finance': 'Finance Sheet',
    'festival.income': 'Total Income',
    'festival.expense': 'Total Expense',
    'festival.remaining': 'Remaining Balance',
    'festival.finalPooja': 'Final Pooja Persons',
    'festival.decoration': 'Decoration & Images',
    'common.loading': 'Loading...',
    'lang.english': 'English',
    'lang.marathi': 'मराठी',
    'lang.switchTo': 'Switch to',
  },
  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.members': 'सदस्य',
    'nav.aarti': 'आरती',
    'nav.programs': 'कार्यक्रम',
    'nav.meetings': 'बैठका',
    'nav.gallery': 'गॅलरी',
    'nav.videos': 'व्हिडिओ',
    'nav.donation': 'देणगी',
    'nav.contact': 'संपर्क',
    'nav.festival2026': '२०२६ गणपती',
    'nav.login': 'लॉगिन',
    'nav.register': 'नोंदणी',
    'nav.logout': 'लॉगआउट',
    'nav.admin': 'अ‍ॅडमिन',
    'nav.dashboard': 'डॅशबोर्ड',
    'hero.welcome': 'श्री गणेशाय नमः',
    'hero.subtitle': 'शिवसयाद्री गणेश मंडळ, उमरखंचन',
    'hero.aarti': 'आरती',
    'hero.programs': 'कार्यक्रम',
    'hero.gallery': 'गॅलरी',
    'hero.donation': 'देणगी',
    'hero.today': 'आज',
    'home.programsTitle': 'आजचा कार्यक्रम',
    'home.membersTitle': 'आमचे सदस्य',
    'home.viewAll': 'सर्व पहा',
    'home.aartiTitle': 'आजची आरती',
    'home.birthdayTitle': 'आजचे वाढदिवस',
    'home.announcements': 'ताज्या घोषणा',
    'home.meetings': 'आगामी बैठका',
    'home.gallery': 'गणेशोत्सवाचे क्षण',
    'footer.made': '२०२६ मध्ये शिवसयाद्री मंडळासाठी बनवले ❤️',
    'footer.rights': 'सर्व हक्क राखीव.',
    'festival.title': 'गणपती उत्सव २०२६',
    'festival.finance': 'हिशोब पत्रक',
    'festival.income': 'एकूण जमा',
    'festival.expense': 'एकूण खर्च',
    'festival.remaining': 'शिल्लक रक्कम',
    'festival.finalPooja': 'अंतिम पूजा व्यक्ती',
    'festival.decoration': 'सजावट आणि फोटो',
    'common.loading': 'लोड होत आहे...',
    'lang.english': 'English',
    'lang.marathi': 'मराठी',
    'lang.switchTo': 'बदला',
  },
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'en')
  useEffect(() => { localStorage.setItem('lang', lang) }, [lang])
  const setLang = (l: Lang) => setLangState(l)
  const t = (key: string) => translations[lang][key] ?? translations['en'][key] ?? key
  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
