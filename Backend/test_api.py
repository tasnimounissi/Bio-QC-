# test_api.py
import requests
import json

# URL de votre API
BASE_URL = "http://localhost:8000"

def test_health():
    """Tester si l'API est vivante"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ API santé: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ API inaccessible: {e}")
        return False

def test_normal_sequence():
    """Tester avec une séquence normale (GAG)"""
    print("\n" + "="*60)
    print("TEST 1: SÉQUENCE NORMALE (GAG)")
    print("="*60)
    
    sequence_normal = """>HBB_normal
ATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG"""
    
    # Sauvegarder dans un fichier temporaire
    with open("test_normal.fasta", "w") as f:
        f.write(sequence_normal)
    
    # Envoyer à l'API
    with open("test_normal.fasta", "rb") as f:
        response = requests.post(
            f"{BASE_URL}/analyze",
            files={"file": f},
            data={
                "p_name": "Patient Normal",
                "p_id": "P001",
                "p_age": 35
            }
        )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 Résultats:")
        print(f"  Codon 6: {data['mutation']['codon6']}")
        print(f"  Statut: {data['mutation']['status']}")
        print(f"  Verdict: {data['ai_report']['verdict']['condition']}")
        print(f"  Position: {data['mutation']['position_brute']}")
        
        # Vérification
        if data['mutation']['status'] == "Sain":
            print("✅ TEST PASSÉ: Séquence normale correctement identifiée")
        else:
            print("❌ TEST ÉCHOUÉ: La séquence normale n'est pas reconnue")
    else:
        print(f"❌ Erreur HTTP: {response.status_code}")
        print(response.text)

def test_mutant_sequence():
    """Tester avec une séquence mutée (GTG)"""
    print("\n" + "="*60)
    print("TEST 2: SÉQUENCE MUTÉE (GTG - Drépanocytose)")
    print("="*60)
    
    sequence_mutant = """>HBB_mutant
ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG"""
    
    # Sauvegarder dans un fichier temporaire
    with open("test_mutant.fasta", "w") as f:
        f.write(sequence_mutant)
    
    # Envoyer à l'API
    with open("test_mutant.fasta", "rb") as f:
        response = requests.post(
            f"{BASE_URL}/analyze",
            files={"file": f},
            data={
                "p_name": "Patient Muté",
                "p_id": "P002",
                "p_age": 28
            }
        )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 Résultats:")
        print(f"  Codon 6: {data['mutation']['codon6']}")
        print(f"  Statut: {data['mutation']['status']}")
        print(f"  Verdict: {data['ai_report']['verdict']['condition']}")
        print(f"  Position: {data['mutation']['position_brute']}")
        
        # Vérification
        if data['mutation']['status'] == "Pathogène":
            print("✅ TEST PASSÉ: Mutation correctement détectée")
        else:
            print(f"❌ TEST ÉCHOUÉ: La mutation n'est pas détectée. Status: {data['mutation']['status']}")
    else:
        print(f"❌ Erreur HTTP: {response.status_code}")
        print(response.text)

def test_sequence_with_start_codon():
    """Tester avec une séquence qui a un ATG clair"""
    print("\n" + "="*60)
    print("TEST 3: SÉQUENCE AVEC ATG CLAIR")
    print("="*60)
    
    # Cette séquence a un ATG clair au début
    sequence_with_atg = """ATG GTG CAC CTG ACT CCT GAG GAG AAG TCT GCC GTT ACT GCC CTG TGG GGC AAG GTG AAC GTG GAT GAA GTT GGT GGT GAG GCC CTG GGC AG"""
    sequence_with_atg = sequence_with_atg.replace(" ", "")
    
    fasta_content = f""">test_with_atg
{sequence_with_atg}"""
    
    with open("test_with_atg.fasta", "w") as f:
        f.write(fasta_content)
    
    with open("test_with_atg.fasta", "rb") as f:
        response = requests.post(
            f"{BASE_URL}/analyze",
            files={"file": f},
            data={
                "p_name": "Test ATG",
                "p_id": "P003",
                "p_age": 40
            }
        )
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 Résultats:")
        print(f"  Codon 6: {data['mutation']['codon6']}")
        print(f"  Statut: {data['mutation']['status']}")
        print(f"  Position: {data['mutation']['position_brute']}")
        
        if data['mutation']['codon6'] == "GAG":
            print("✅ TEST PASSÉ: ATG correctement localisé")
        else:
            print(f"⚠️ Codon détecté: {data['mutation']['codon6']}")
    else:
        print(f"❌ Erreur: {response.status_code}")

if __name__ == "__main__":
    print("🧬 TEST DE L'API D'ANALYSE GÉNÉTIQUE HBB")
    print("="*60)
    
    # Vérifier que l'API est accessible
    if not test_health():
        print("\n❌ Impossible de continuer - API non accessible")
        print("Assurez-vous que uvicorn tourne sur http://localhost:8000")
        exit(1)
    
    # Exécuter les tests
    test_normal_sequence()
    test_mutant_sequence()
    test_sequence_with_start_codon()
    
    print("\n" + "="*60)
    print("🏁 TESTS TERMINÉS")