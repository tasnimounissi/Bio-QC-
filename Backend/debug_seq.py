# debug_sequence.py
def debug_codon_detection():
    """Debug simple de la détection du codon 6"""
    
    # Séquence mutée
    sequence = "ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG"
    
    print("Séquence complète:")
    print(sequence)
    print(f"Longueur: {len(sequence)}")
    print("\nAnalyse pas à pas:")
    
    # Chercher ATG
    start_pos = sequence.find('ATG')
    print(f"Position de ATG: {start_pos}")
    
    if start_pos != -1:
        # Afficher les codons
        print("\nCodons (par groupe de 3):")
        for i in range(0, min(60, len(sequence) - start_pos), 3):
            codon_pos = start_pos + i
            codon = sequence[codon_pos:codon_pos + 3]
            codon_number = i//3 + 1
            print(f"  Codon {codon_number}: {codon} (positions {codon_pos+1}-{codon_pos+3})")
            
            if codon_number == 6:
                print(f"\n  🔴 COdon 6 trouvé: {codon}")
                if codon == "GTG":
                    print("  ✅ MUTATION DÉTECTÉE - Drépanocytose")
                elif codon == "GAG":
                    print("  ✅ SÉQUENCE NORMALE")
                else:
                    print(f"  ⚠️ Autre: {codon}")

if __name__ == "__main__":
    debug_codon_detection()