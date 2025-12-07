/**
 * Consent configuration with versioned text blocks.
 * Update the version whenever the consent copy changes to re-request approvals.
 */

export const CONSENT_VERSION = '1.0.0'

export const CONSENT_TEXT = {
  title: 'Nutzungsbedingungen & Datenschutz',
  sections: [
    {
      heading: 'Willkommen bei Rhythmologicum Connect',
      content:
        'Bevor Sie mit dem Stress- & Resilienz-Check beginnen, lesen und akzeptieren Sie bitte die folgenden Hinweise.',
    },
    {
      heading: 'Datenerhebung und -verwendung',
      content:
        'Wir verarbeiten Ihre personenbezogenen Daten (E-Mail, Antworten) ausschließlich zur Durchführung Ihrer Analyse. Eine Weitergabe an Dritte erfolgt nicht.',
    },
    {
      heading: 'Freiwilligkeit',
      content:
        'Die Teilnahme ist freiwillig. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.',
    },
    {
      heading: 'Datensicherheit',
      content:
        'Ihre Daten werden auf sicheren Servern gespeichert und durch aktuelle Sicherheitsmaßnahmen geschützt.',
    },
    {
      heading: 'Ihre Rechte',
      content:
        'Sie haben das Recht auf Auskunft, Berichtigung, Löschung sowie Einschränkung der Verarbeitung Ihrer Daten.',
    },
  ],
  checkboxText:
    'Ich habe die Nutzungsbedingungen und Datenschutzhinweise gelesen und akzeptiere diese.',
  buttons: {
    accept: 'Akzeptieren & fortfahren',
    decline: 'Ablehnen',
  },
  errors: {
    consentDeclined: 'Sie müssen die Nutzungsbedingungen akzeptieren, um fortzufahren.',
  },
}
