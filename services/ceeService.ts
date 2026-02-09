import { CeeKnowledgeItem } from '../types';

/**
 * Simule une extraction profonde du portail ministériel avec métadonnées précises.
 */
export const mockScrapeCEE = async (): Promise<CeeKnowledgeItem[]> => {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return [
    // --- POLITIQUES GÉNÉRALES ---
    {
      id: 'pol-5eme-periode',
      type: 'POLITIQUE',
      title: 'Modalités de la 5ème période des CEE',
      versionDate: '2022-01-01',
      url: 'https://www.ecologie.gouv.fr/dispositif-des-certificats-deconomies-denergie',
      content: 'La 5ème période (2022-2025) fixe un objectif de 2500 TWh cumac. Elle renforce les contrôles sur les opérations "Coup de Pouce" et modifie les coefficients de précarité énergétique.'
    },

    // --- SECTEUR RÉSIDENTIEL (BAR) ---
    {
      id: 'BAR-TH-164-v3',
      type: 'FICHE',
      code: 'BAR-TH-164',
      title: 'Pompe à chaleur de type air/eau',
      sector: 'Résidentiel',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164.pdf',
      content: 'ETAS (Efficacité Énergétique Saisonnière) ≥ 111% pour basse température, ≥ 126% pour moyenne/haute température. COP mesuré selon NF EN 14511.'
    },
    {
      id: 'BAR-TH-164-v2',
      type: 'FICHE',
      code: 'BAR-TH-164',
      title: 'Pompe à chaleur de type air/eau (Ancienne Version)',
      sector: 'Résidentiel',
      versionDate: '2021-04-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164-v2.pdf',
      content: 'ETAS ≥ 102%. Version applicable aux devis signés avant le 1er Janvier 2024.'
    },
    {
      id: 'BAR-EN-101',
      type: 'FICHE',
      code: 'BAR-EN-101',
      title: 'Isolation de combles ou de toitures',
      sector: 'Résidentiel',
      versionDate: '2023-05-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-EN-101.pdf',
      content: 'Résistance thermique R ≥ 7 m².K/W en combles perdus, R ≥ 6 m².K/W en rampant de toiture. Certification ACERMI obligatoire.'
    },

    // --- SECTEUR TERTIAIRE (BAT) ---
    {
      id: 'BAT-TH-116',
      type: 'FICHE',
      code: 'BAT-TH-116',
      title: 'Pompe à chaleur de type air/eau ou eau/eau',
      sector: 'Tertiaire',
      versionDate: '2024-03-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/BAT-TH-116.pdf',
      content: 'Puissance ≤ 400 kW. Régulateur de classe IV minimum requis. Note de dimensionnement obligatoire jointe au dossier.'
    },

    // --- SECTEUR INDUSTRIE (IND) ---
    {
      id: 'IND-BA-112',
      type: 'FICHE',
      code: 'IND-BA-112',
      title: 'Système de récupération de chaleur sur un groupe de production de froid',
      sector: 'Industrie',
      versionDate: '2023-11-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/IND-BA-112.pdf',
      content: 'La chaleur récupérée doit être utilisée pour le chauffage, l\'eau chaude sanitaire ou un process industriel. Économie d\'énergie calculée selon la puissance électrique du compresseur.'
    },

    // --- TRANSVERSAL (TRA) ---
    {
      id: 'TRA-EQ-101',
      type: 'FICHE',
      code: 'TRA-EQ-101',
      title: 'Variateur électronique de vitesse sur un moteur asynchrone',
      sector: 'Transversal',
      versionDate: '2024-01-01',
      url: 'https://www.ecologie.gouv.fr/sites/default/files/fiches/TRA-EQ-101.pdf',
      content: 'Applicable aux moteurs de pompage, ventilation ou compression. Hors moteurs à puissance variable native.'
    }
  ];
};

export const getEffectiveKnowledge = (allItems: CeeKnowledgeItem[], referenceDate: string): CeeKnowledgeItem[] => {
  const ref = new Date(referenceDate).getTime();
  const fiches = allItems.filter(i => i.type === 'FICHE');
  const others = allItems.filter(i => i.type !== 'FICHE');

  const groupedFiches = fiches.reduce((acc, op) => {
    if (!op.code) return acc;
    if (!acc[op.code]) acc[op.code] = [];
    acc[op.code].push(op);
    return acc;
  }, {} as Record<string, CeeKnowledgeItem[]>);

  const results: CeeKnowledgeItem[] = [];

  Object.keys(groupedFiches).forEach(code => {
    const versions = groupedFiches[code]
      .filter(v => new Date(v.versionDate).getTime() <= ref)
      .sort((a, b) => new Date(b.versionDate).getTime() - new Date(a.versionDate).getTime());
    if (versions.length > 0) results.push(versions[0]);
  });

  others.forEach(item => {
    if (new Date(item.versionDate).getTime() <= ref) {
      results.push(item);
    }
  });

  return results;
};