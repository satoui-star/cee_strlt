import datetime
from typing import List, Dict, Any, Optional

class CeeService:
    @staticmethod
    def mock_scrape_cee() -> List[Dict[str, Any]]:
        """Simule l'extraction des données du portail CEE."""
        return [
            {
                "id": "pol-5eme-periode",
                "type": "POLITIQUE",
                "title": "Modalités de la 5ème période des CEE",
                "versionDate": "2022-01-01",
                "url": "https://www.ecologie.gouv.fr/dispositif-des-certificats-deconomies-denergie",
                "content": "La 5ème période (2022-2025) fixe un objectif de 2500 TWh cumac. Elle renforce les contrôles."
            },
            {
                "id": "BAR-TH-164-v3",
                "type": "FICHE",
                "code": "BAR-TH-164",
                "title": "Pompe à chaleur de type air/eau",
                "sector": "Résidentiel",
                "versionDate": "2024-01-01",
                "url": "https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164.pdf",
                "content": "ETAS ≥ 111% pour basse température. COP mesuré selon NF EN 14511."
            },
            {
                "id": "BAR-TH-164-v2",
                "type": "FICHE",
                "code": "BAR-TH-164",
                "title": "Pompe à chaleur de type air/eau (Ancienne)",
                "sector": "Résidentiel",
                "versionDate": "2021-04-01",
                "url": "https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-TH-164-v2.pdf",
                "content": "ETAS ≥ 102%. Applicable avant le 1er Janvier 2024."
            },
            {
                "id": "BAR-EN-101",
                "type": "FICHE",
                "code": "BAR-EN-101",
                "title": "Isolation de combles ou de toitures",
                "sector": "Résidentiel",
                "versionDate": "2023-05-01",
                "url": "https://www.ecologie.gouv.fr/sites/default/files/fiches/BAR-EN-101.pdf",
                "content": "Résistance thermique R ≥ 7 m².K/W en combles perdus. ACERMI obligatoire."
            }
        ]

    @staticmethod
    def get_effective_knowledge(all_items: List[Dict[str, Any]], reference_date: datetime.date) -> List[Dict[str, Any]]:
        """Filtre les fiches pour ne garder que la version applicable à la date donnée."""
        ref_ts = datetime.datetime.combine(reference_date, datetime.time.min)
        
        fiches = [i for i in all_items if i.get('type') == 'FICHE']
        others = [i for i in all_items if i.get('type') != 'FICHE']
        
        # Group by code
        grouped = {}
        for f in fiches:
            code = f.get('code')
            if code not in grouped: grouped[code] = []
            grouped[code].append(f)
            
        results = []
        for code, versions in grouped.items():
            # Filter by date and sort descending
            valid_versions = [
                v for v in versions 
                if datetime.datetime.strptime(v['versionDate'], '%Y-%m-%d') <= ref_ts
            ]
            valid_versions.sort(key=lambda x: x['versionDate'], reverse=True)
            if valid_versions:
                results.append(valid_versions[0])
                
        for item in others:
            if datetime.datetime.strptime(item['versionDate'], '%Y-%m-%d') <= ref_ts:
                results.append(item)
                
        return results
