-- E6.5.7 Test Data: Sample Content Pages for Manual Verification
-- 
-- This script inserts sample content pages that can be used to test
-- the /patient/content/[slug] route implementation.
-- 
-- Usage: Run this after seeding the database to add test content pages

-- Insert test content page 1: Stress verstehen
INSERT INTO content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  category,
  priority
) VALUES (
  'stress-verstehen',
  'Stress verstehen',
  'Erfahren Sie mehr über die verschiedenen Arten von Stress und deren Auswirkungen auf Ihre Gesundheit.',
  E'# Was ist Stress?\n\nStress ist eine natürliche Reaktion des Körpers auf Herausforderungen oder Bedrohungen. Es ist ein evolutionärer Mechanismus, der uns hilft, mit schwierigen Situationen umzugehen.\n\n## Arten von Stress\n\n### Akuter Stress\nKurzfristige Reaktion auf unmittelbare Herausforderungen. Dieser Stress ist normal und oft hilfreich.\n\n### Chronischer Stress\nLanganhaltender Stress kann zu gesundheitlichen Problemen führen:\n\n- Schlafstörungen\n- Kopfschmerzen\n- Verdauungsprobleme\n- Erhöhter Blutdruck\n\n## Stresssymptome erkennen\n\n| Körperlich | Emotional | Verhalten |\n|------------|-----------|----------|\n| Müdigkeit | Reizbarkeit | Sozialer Rückzug |\n| Kopfschmerzen | Angst | Veränderter Appetit |\n| Muskelverspannungen | Überforderung | Konzentrationsprobleme |\n\n## Was können Sie tun?\n\n1. **Achtsamkeit üben**: Meditation und Atemübungen können helfen\n2. **Regelmäßige Bewegung**: Sport reduziert Stresshormone\n3. **Soziale Kontakte pflegen**: Sprechen Sie mit Freunden und Familie\n4. **Professionelle Hilfe**: Bei chronischem Stress sollten Sie sich Unterstützung holen\n\n> **Wichtig**: Stress ist eine normale Reaktion, aber chronischer Stress sollte ernst genommen werden.\n\n[Mehr erfahren über Resilienztechniken](/content/resilienztechniken)',
  'published',
  'default',
  'info',
  10
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert test content page 2: Resilienztechniken
INSERT INTO content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  category,
  priority
) VALUES (
  'resilienztechniken',
  'Resilienztechniken',
  'Praktische Methoden zur Stärkung Ihrer psychischen Widerstandskraft.',
  E'# Resilienztechniken für den Alltag\n\nResilienz ist die Fähigkeit, mit Stress und Widrigkeiten umzugehen und sich davon zu erholen.\n\n## Die 7 Säulen der Resilienz\n\n1. **Optimismus**: Positive Grundhaltung entwickeln\n2. **Akzeptanz**: Unveränderliches annehmen\n3. **Lösungsorientierung**: Auf Lösungen statt Probleme fokussieren\n4. **Selbstwirksamkeit**: Vertrauen in eigene Fähigkeiten\n5. **Verantwortung übernehmen**: Aktiv gestalten\n6. **Netzwerkorientierung**: Soziale Unterstützung nutzen\n7. **Zukunftsplanung**: Ziele setzen und verfolgen\n\n## Praktische Übungen\n\n### Achtsamkeitsmeditation (5 Minuten täglich)\n- Finden Sie einen ruhigen Ort\n- Konzentrieren Sie sich auf Ihren Atem\n- Nehmen Sie Gedanken wahr, ohne sie zu bewerten\n- Kehren Sie sanft zur Atmung zurück\n\n### Dankbarkeitstagebuch\nNotieren Sie täglich drei Dinge, für die Sie dankbar sind.\n\n### Progressive Muskelentspannung\nSpannen und entspannen Sie nacheinander verschiedene Muskelgruppen.\n\n## Weiterführende Ressourcen\n\n- [Stress verstehen](/content/stress-verstehen)\n- [Schlafhygiene](/content/schlafhygiene)\n\n**Hinweis**: Diese Techniken ersetzen keine professionelle Therapie bei schwerwiegenden psychischen Problemen.',
  'published',
  'default',
  'action',
  20
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert test content page 3: Schlafhygiene
INSERT INTO content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  category,
  priority
) VALUES (
  'schlafhygiene',
  'Schlafhygiene',
  'Tipps für besseren Schlaf und erholsame Nächte.',
  E'# Schlafhygiene: Der Weg zu erholsamem Schlaf\n\nGuter Schlaf ist entscheidend für körperliche und psychische Gesundheit.\n\n## Die Grundregeln\n\n### Regelmäßiger Schlaf-Wach-Rhythmus\n- Gleiche Schlafens- und Aufstehzeiten (auch am Wochenende)\n- 7-9 Stunden Schlaf pro Nacht\n\n### Optimale Schlafumgebung\n\n| Faktor | Empfehlung |\n|--------|------------|\n| Temperatur | 16-19°C |\n| Licht | Dunkel (Verdunklungsvorhänge) |\n| Lärm | Ruhig (Ohrstöpsel wenn nötig) |\n| Matratze | Bequem und stützend |\n\n### Vor dem Schlafengehen vermeiden\n\n- ❌ Koffein (6 Stunden vorher)\n- ❌ Alkohol (3 Stunden vorher)\n- ❌ Schweres Essen (2 Stunden vorher)\n- ❌ Intensive körperliche Aktivität\n- ❌ Bildschirmzeit (Blaulicht)\n\n## Entspannungsrituale\n\n1. Lesen (kein E-Reader)\n2. Warmes Bad\n3. Leichte Dehnübungen\n4. Atemübungen\n\n## Bei Schlafproblemen\n\nWenn Sie nicht einschlafen können:\n- Stehen Sie nach 20 Minuten auf\n- Machen Sie eine ruhige Aktivität\n- Gehen Sie erst wieder ins Bett, wenn Sie müde sind\n\n**Wichtig**: Bei anhaltenden Schlafproblemen konsultieren Sie einen Arzt.\n\n[Zurück zu Stress verstehen](/content/stress-verstehen)',
  'published',
  'default',
  'info',
  40
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert draft content page (should NOT be visible)
INSERT INTO content_pages (
  slug,
  title,
  excerpt,
  body_markdown,
  status,
  layout,
  category,
  priority
) VALUES (
  'draft-page',
  'Draft Page - Should Not Be Visible',
  'This is a draft page that should not be accessible.',
  E'# Draft Content\n\nThis page should not be visible to patients.',
  'draft',
  'default',
  'info',
  0
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body_markdown = EXCLUDED.body_markdown,
  status = EXCLUDED.status,
  updated_at = now();

-- Verification: List all content pages
SELECT slug, title, status, category, priority, created_at
FROM content_pages
WHERE deleted_at IS NULL
ORDER BY priority ASC, slug ASC;
