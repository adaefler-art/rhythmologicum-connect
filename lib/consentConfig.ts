/**
 * Consent Configuration
 * 
 * This file contains the current consent version and text.
 * When updating the consent text, increment the version number to trigger re-consent.
 */

export const CONSENT_VERSION = '1.0.0'

export const CONSENT_TEXT = {
  title: 'Nutzungsbedingungen & Datenschutz',
  
  sections: [
    {
      heading: 'Willkommen bei Rhythmologicum Connect',
      content: 'Bevor Sie mit dem Stress- & Resilienz-Check beginnen, bitten wir Sie, die folgenden Nutzungsbedingungen und Datenschutzhinweise zu lesen und zu akzeptieren.'
    },
    {
      heading: 'Datenerhebung und -verwendung',
      content: 'Wir erheben und verarbeiten Ihre personenbezogenen Daten (E-Mail-Adresse, Antworten auf Fragebögen) ausschließlich zum Zweck der Durchführung Ihrer persönlichen Stress- und Resilienz-Analyse. Die Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.'
    },
    {
      heading: 'Freiwilligkeit',
      content: 'Die Teilnahme am Stress-Check und die Angabe Ihrer Daten erfolgen freiwillig. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.'
    },
    {
      heading: 'Datensicherheit',
      content: 'Ihre Daten werden auf sicheren Servern gespeichert und durch moderne Verschlüsselungstechnologien geschützt. Wir treffen angemessene technische und organisatorische Maßnahmen zum Schutz Ihrer personenbezogenen Daten.'
    },
    {
      heading: 'Ihre Rechte',
      content: 'Sie haben das Recht auf Auskunft über Ihre gespeicherten Daten, deren Berichtigung, Löschung oder Einschränkung der Verarbeitung. Bei Fragen zum Datenschutz kontaktieren Sie uns bitte.'
    }
  ],
  
  checkboxText: 'Ich habe die Nutzungsbedingungen und Datenschutzhinweise gelesen und akzeptiere diese.',
  
  buttons: {
    accept: 'Akzeptieren & fortfahren',
    decline: 'Ablehnen'
  },

  errors: {
    consentDeclined: 'Sie müssen die Nutzungsbedingungen akzeptieren, um fortzufahren.'
  }
}
