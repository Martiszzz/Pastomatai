import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SiuntuPerziurosLangas.module.css";

interface Siunta {
    siuntosNr: number;
    busena: string;
    lipdukoNr: number;
    kodas: number;
    uzsakymoId: number;
    kaina: number;
    uzsakymo_busena: string;
    svoris: number;
    gavejo_vardas: string;
    gavejo_pavarde: string;
    gavejo_adresas: string;
    uzsakymo_laikas: string;
}

export default function SiuntuPerzurosLangas() {
    const [siuntos, setSiuntos] = useState<Siunta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtras, setFiltras] = useState<string>("");
    const navigate = useNavigate();

    useEffect(() => {
        const vartotojoId = localStorage.getItem("vartotojoId");
        
        console.log("Vartotojo ID:", vartotojoId);
        
        if (!vartotojoId) {
            navigate("/login");
            return;
        }

        const gausiSiuntas = async () => {
            try {
                const response = await fetch(`/api/siuntos-vartotojo/${vartotojoId}`);
                
                console.log("API response status:", response.status);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Nepavyko gauti siuntų");
                }
                
                const data = await response.json();
                console.log("Gautos siuntos:", data);
                setSiuntos(data);
                setError(null);
            } catch (err) {
                console.error("Klaida:", err);
                setError(err instanceof Error ? err.message : "Nežinoma klaida");
            } finally {
                setLoading(false);
            }
        };

        gausiSiuntas();
    }, [navigate]);

    const filtruotosSiuntos = siuntos.filter(siunta =>
        siunta.busena.toLowerCase().includes(filtras.toLowerCase()) ||
        siunta.gavejo_vardas.toLowerCase().includes(filtras.toLowerCase()) ||
        siunta.siuntosNr.toString().includes(filtras)
    );
    //KAI BUS REGISTRACIJA - REMOVE
    const handleRegistruotiUzsakyma = () => {
        // Neveikiantis mygtukas
        alert("Šis funkcionalumas dar nėra aktyvus");
    };
    //
    if (loading) return <div className={styles.container}><p>Kraunama...</p></div>;

    return (
        <div className={styles.container}>
            <h1>Siuntos</h1>
            
            <div className={styles.controls}>
                <input 
                    type="text" 
                    placeholder="Paieška..."
                    value={filtras}
                    onChange={(e) => setFiltras(e.target.value)}
                    className={styles.filterInput}
                />
                
                <button 
                    onClick={handleRegistruotiUzsakyma}
                    className={styles.registerButton}
                >
                    Registruoti užsakymą
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {filtruotosSiuntos.length === 0 ? (
                <p className={styles.noData}>Nėra siuntų</p>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Siuntos Nr.</th>
                            <th>Gavėjas</th>
                            <th>Adresasas</th>
                            <th>Kaina</th>
                            <th>Svoris</th>
                            <th>Būsena</th>
                            <th>Apmokėjimas</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtruotosSiuntos.map(siunta => (
                            <tr key={siunta.siuntosNr}>
                                <td>{siunta.siuntosNr}</td>
                                <td>{siunta.gavejo_vardas} {siunta.gavejo_pavarde}</td>
                                <td>{siunta.gavejo_adresas}</td>
                                <td>€{siunta.kaina.toFixed(2)}</td>
                                <td>{siunta.svoris}kg</td>
                                <td className={styles[`status-${siunta.busena}`]}>
                                    {siunta.busena}
                                </td>
                                <td className={styles[`payment-${siunta.uzsakymo_busena}`]}>
                                    {siunta.uzsakymo_busena}
                                </td>
                                <td>{new Date(siunta.uzsakymo_laikas).toLocaleDateString('lt-LT')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
