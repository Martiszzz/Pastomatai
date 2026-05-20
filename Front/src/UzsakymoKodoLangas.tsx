import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./UzsakymoKodoLangas.module.css";
import "./global.css";

interface UzsakymoKodas {
    uzsakymoId: number;
    kaina: number;
    uzsakymo_busena: string;
    svoris: number;
    gavejo_vardas: string;
    gavejo_pavarde: string;
    gavejo_adresas: string;
    siuntosNr: number;
    siuntos_busena: string;
    lipdukoNr: number;
    kodas: number;
}

function UzsakymoKodoLangas() {
    const { uzsakymoId } = useParams();
    const navigate = useNavigate();
    const [duomenys, setDuomenys] = useState<UzsakymoKodas | null>(null);
    const [zinute, setZinute] = useState<string>("");
    const [sekme, setSekme] = useState<string>("");

    useEffect(() => {
        GautiUzsakyma();
    }, [uzsakymoId]);

    async function GautiUzsakyma() {
        try {
            const response = await fetch(`/api/uzsakymas/${uzsakymoId}`);

            if (!response.ok) {
                setZinute("Užsakymas nerastas");
                return;
            }

            const data = await response.json();
            setDuomenys(data);
        } catch {
            setZinute("Serverio klaida. Bandykite dar kartą");
        }
    }

    async function ApmoketiSiunta() {
        setZinute("");
        setSekme("");

        const response = await fetch("/api/siuntos-apmokejimas", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                uzsakymoId: Number(uzsakymoId)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setZinute(data.error || "Apmokėjimas nepavyko");
            return;
        }

        setSekme("Siunta apmokėta");
        await GautiUzsakyma();
    }

    function GriztiISiuntas() {
        navigate("/siuntos");
    }

    if (!duomenys) {
        return (
            <div className={styles.container}>
                <h1>Užsakymo kodas</h1>
                {zinute ? <p className={styles.klaida}>{zinute}</p> : <p>Kraunama...</p>}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Užsakymo kodas</h1>

            {zinute && <p className={styles.klaida}>{zinute}</p>}
            {sekme && <p className={styles.sekme}>{sekme}</p>}

            <div className={styles.kortele}>
                <div className={styles.info}>
                    <p><b>Užsakymo ID:</b> {duomenys.uzsakymoId}</p>
                    <p><b>Siuntos Nr.:</b> {duomenys.siuntosNr}</p>
                    <p><b>Kodas:</b> {duomenys.kodas}</p>
                    <p><b>Lipduko Nr.:</b> {duomenys.lipdukoNr}</p>
                    <p><b>Gavėjas:</b> {duomenys.gavejo_vardas} {duomenys.gavejo_pavarde}</p>
                    <p><b>Gavėjo paštomatas:</b> {duomenys.gavejo_adresas}</p>
                    <p><b>Svoris:</b> {duomenys.svoris} kg</p>
                    <p><b>Kaina:</b> {duomenys.kaina.toFixed(2)} €</p>
                    <p><b>Apmokėjimas:</b> {duomenys.uzsakymo_busena}</p>
                    <p><b>Siuntos būsena:</b> {duomenys.siuntos_busena}</p>
                </div>

                <div className={styles.mygtukai}>
                    <button
                        type="button"
                        onClick={ApmoketiSiunta}
                        disabled={duomenys.uzsakymo_busena === "apmoketa"}
                    >
                        Apmokėti siuntą
                    </button>
                    <button type="button" onClick={GriztiISiuntas} className={styles.atgalMygtukas}>
                        Grįžti į siuntas
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UzsakymoKodoLangas;