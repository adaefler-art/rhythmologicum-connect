import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Datenschutz & Datennutzung | Rhythmologicum Connect',
  description:
    'Informationen zum Datenschutz und zur Datennutzung bei Rhythmologicum Connect',
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium mb-4"
          >
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Datenschutz & Datennutzung
          </h1>
          <p className="text-sm text-slate-500">
            Informationen zur Verarbeitung Ihrer personenbezogenen Daten
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose prose-slate max-w-none">
          {/* Zweck der Anwendung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              1. Zweck der Anwendung
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Rhythmologicum Connect ist eine Plattform zur Bewertung von Stress und Resilienz
              bei Patientinnen und Patienten. Das System ermöglicht es Ihnen, einen
              strukturierten Fragebogen auszufüllen und darauf basierend eine individuelle
              Analyse Ihrer Stressbelastung und Resilienzfaktoren zu erhalten.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Die gewonnenen Erkenntnisse unterstützen Sie und Ihre behandelnden Ärztinnen und
              Ärzte dabei, gezielte Maßnahmen zur Stressbewältigung und Gesundheitsförderung zu
              entwickeln.
            </p>
          </section>

          {/* Pilotprojekt */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Pilotprojekt</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Diese Anwendung befindet sich aktuell in der Pilotphase. Sie dient der Erprobung
              und Evaluation neuer Ansätze zur digitalen Gesundheitsversorgung im Bereich Stress
              und Resilienz.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Im Rahmen des Pilotprojekts werden Funktionen getestet und optimiert. Ihre
              Teilnahme ist freiwillig und hilft uns, die Qualität und Nutzerfreundlichkeit der
              Plattform kontinuierlich zu verbessern.
            </p>
          </section>

          {/* Datenerhebung und -nutzung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              3. Welche Daten werden erhoben?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Wir erheben und verarbeiten folgende personenbezogene Daten:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-3">
              <li>
                <strong>Kontaktdaten:</strong> E-Mail-Adresse (für die Registrierung und den
                Login)
              </li>
              <li>
                <strong>Fragebogendaten:</strong> Ihre Antworten im Stress- & Resilienz-Check
              </li>
              <li>
                <strong>Analysedaten:</strong> Automatisch generierte Auswertungen und
                Empfehlungen basierend auf Ihren Antworten
              </li>
              <li>
                <strong>Nutzungsdaten:</strong> Zeitpunkt der Bewertungen, Verlaufsdaten
              </li>
              <li>
                <strong>Einwilligungsdaten:</strong> Ihre Zustimmung zu diesen
                Nutzungsbedingungen (inkl. IP-Adresse und Browser-Informationen zum Zeitpunkt
                der Zustimmung)
              </li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              Wir erheben <strong>keine</strong> Daten durch externe Tracking-Tools oder
              Analytics-Dienste. Es werden keine Cookies von Drittanbietern gesetzt.
            </p>
          </section>

          {/* Zweck der Datenverarbeitung */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              4. Wofür werden die Daten verwendet?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Die Verarbeitung Ihrer Daten erfolgt ausschließlich zu folgenden Zwecken:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                Durchführung und Auswertung Ihrer Stress- & Resilienz-Bewertung mittels
                KI-gestützter Analyse
              </li>
              <li>Bereitstellung personalisierter Empfehlungen und Berichte</li>
              <li>
                Ermöglichung des Zugriffs für autorisierte Klinikärztinnen und -ärzte auf Ihre
                Bewertungsergebnisse (im Rahmen Ihrer Behandlung)
              </li>
              <li>
                Verbesserung der Plattform und wissenschaftliche Auswertung in anonymisierter
                Form (nur im Rahmen des Pilotprojekts)
              </li>
            </ul>
          </section>

          {/* Speicherort und technische Sicherheit */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              5. Wo werden die Daten gespeichert?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Ihre Daten werden sicher auf Servern der Plattform{' '}
              <strong>Supabase</strong> gespeichert. Supabase ist ein professioneller
              Datenbank-Hosting-Dienst, der höchste Sicherheitsstandards erfüllt.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Technische Sicherheitsmaßnahmen:
              </h3>
              <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
                <li>Verschlüsselte Übertragung aller Daten (HTTPS/TLS)</li>
                <li>Verschlüsselte Speicherung sensibler Informationen</li>
                <li>
                  <strong>Row-Level Security (RLS):</strong> Jeder Nutzer kann nur auf seine
                  eigenen Daten zugreifen
                </li>
                <li>
                  Rollenbasierte Zugriffskontrolle: Nur autorisierte Klinikärztinnen und -ärzte
                  können auf Patientendaten zugreifen
                </li>
                <li>Regelmäßige Sicherheits-Updates und Backups</li>
              </ul>
            </div>
            <p className="text-slate-700 leading-relaxed">
              Die Datenspeicherung erfolgt auf Servern innerhalb der Europäischen Union, sodass
              die Vorgaben der Datenschutz-Grundverordnung (DSGVO) eingehalten werden.
            </p>
          </section>

          {/* Row-Level Security */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              6. Was ist Row-Level Security (RLS)?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Row-Level Security (RLS) ist eine moderne Sicherheitstechnik auf Datenbankebene,
              die sicherstellt, dass jeder Nutzer ausschließlich Zugriff auf die eigenen Daten
              hat.
            </p>
            <p className="text-slate-700 leading-relaxed mb-3">
              Konkret bedeutet das für Sie:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                Sie können nur Ihre eigenen Bewertungen, Berichte und persönlichen Informationen
                einsehen
              </li>
              <li>
                Andere Patientinnen und Patienten haben keinen Zugriff auf Ihre Daten – selbst
                wenn sie versuchen sollten, darauf zuzugreifen
              </li>
              <li>
                Nur autorisierte Klinikärztinnen und -ärzte können (mit entsprechender
                Berechtigung) auf Ihre medizinischen Daten zugreifen
              </li>
            </ul>
          </section>

          {/* Weitergabe an Dritte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              7. Werden Daten an Dritte weitergegeben?
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Ihre personenbezogenen Daten werden <strong>nicht</strong> an Dritte verkauft oder
              zu Werbezwecken weitergegeben.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Eine Weitergabe erfolgt nur in folgenden Fällen:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>
                An autorisierte Klinikärztinnen und -ärzte im Rahmen Ihrer medizinischen
                Versorgung
              </li>
              <li>
                Zur Verarbeitung durch technische Dienstleister (z.B. Supabase als
                Hosting-Anbieter), die vertraglich zur Einhaltung des Datenschutzes verpflichtet
                sind
              </li>
              <li>Wenn gesetzliche Verpflichtungen dies erfordern</li>
            </ul>
          </section>

          {/* Ihre Rechte */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Ihre Rechte</h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Sie haben jederzeit folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-3">
              <li>
                <strong>Auskunftsrecht:</strong> Sie können Auskunft über die von uns
                gespeicherten Daten verlangen
              </li>
              <li>
                <strong>Berichtigungsrecht:</strong> Sie können die Berichtigung unrichtiger
                Daten verlangen
              </li>
              <li>
                <strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen
                (&quot;Recht auf Vergessenwerden&quot;)
              </li>
              <li>
                <strong>Einschränkung der Verarbeitung:</strong> Sie können eine Einschränkung
                der Datenverarbeitung verlangen
              </li>
              <li>
                <strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem
                strukturierten, gängigen Format erhalten
              </li>
              <li>
                <strong>Widerrufsrecht:</strong> Sie können Ihre Einwilligung zur
                Datenverarbeitung jederzeit mit Wirkung für die Zukunft widerrufen
              </li>
              <li>
                <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei einer
                Datenschutz-Aufsichtsbehörde zu beschweren
              </li>
            </ul>
            <p className="text-slate-700 leading-relaxed">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an die im Impressum angegebene
              Kontaktadresse.
            </p>
          </section>

          {/* Speicherdauer */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Speicherdauer</h2>
            <p className="text-slate-700 leading-relaxed">
              Ihre Daten werden gespeichert, solange Sie ein aktives Konto haben oder solange es
              für die oben genannten Zwecke erforderlich ist. Nach Löschung Ihres Kontos werden
              alle personenbezogenen Daten unwiderruflich gelöscht, soweit keine gesetzlichen
              Aufbewahrungspflichten bestehen.
            </p>
          </section>

          {/* Freiwilligkeit */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Freiwilligkeit</h2>
            <p className="text-slate-700 leading-relaxed">
              Die Nutzung von Rhythmologicum Connect und die Durchführung des Stress- &
              Resilienz-Checks sind vollständig freiwillig. Sie können Ihre Teilnahme jederzeit
              ohne Angabe von Gründen beenden.
            </p>
          </section>

          {/* Kontakt */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              11. Kontakt & Verantwortliche Stelle
            </h2>
            <p className="text-slate-700 leading-relaxed mb-3">
              Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist die im Impressum
              genannte Stelle.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich
              jederzeit an uns wenden.
            </p>
          </section>

          {/* Änderungen */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              12. Änderungen dieser Datenschutzerklärung
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
              Rechtslagen oder bei Änderungen der Plattform anzupassen. Die aktuelle Version ist
              stets auf dieser Seite verfügbar.
            </p>
          </section>
        </div>

        {/* Footer with last updated */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </main>
  )
}
