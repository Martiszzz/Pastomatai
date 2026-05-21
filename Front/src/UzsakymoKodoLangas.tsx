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
    kodas: number;
}

function UzsakymoKodoLangas() {
    const { uzsakymoId } = useParams();
    const navigate = useNavigate();

    const [duomenys, setDuomenys] = useState<UzsakymoKodas | null>(null);

    useEffect(() => {
        GautiUzsakyma();
    }, [uzsakymoId]);

    async function GautiUzsakyma() {
        const response = await fetch(`/api/uzsakymas/${uzsakymoId}`);
        const data = await response.json();

        setDuomenys(data);
    }

    function PateiktiKodaIrSiuntosDuomenis() {
        return (
            <div className={styles.info}>
                <p><b>Užsakymo ID:</b> {duomenys?.uzsakymoId}</p>
                <p><b>Siuntos Nr.:</b> {duomenys?.siuntosNr}</p>
                <p><b>Kodas:</b> {duomenys?.kodas}</p>
                <p><b>Gavėjas:</b> {duomenys?.gavejo_vardas} {duomenys?.gavejo_pavarde}</p>
                <p><b>Gavėjo paštomatas:</b> {duomenys?.gavejo_adresas}</p>
                <p><b>Svoris:</b> {duomenys?.svoris} kg</p>
                <p><b>Kaina:</b> {Number(duomenys?.kaina).toFixed(2)} €</p>
                <p><b>Apmokėjimas:</b> {duomenys?.uzsakymo_busena}</p>
                <p><b>Siuntos būsena:</b> {duomenys?.siuntos_busena}</p>
            </div>
        );
    }

    function GriztiISiuntas() {
        navigate("/siuntos");
    }

    if (!duomenys) {
        return (
            <div className={styles.container}>
                <h1>Užsakymo kodas</h1>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1>Užsakymo kodas</h1>

            <div className={styles.kortele}>
                {PateiktiKodaIrSiuntosDuomenis()}

                <div className={styles.mygtukai}>
                    <button type="button" onClick={GriztiISiuntas} className={styles.atgalMygtukas}>
                        Grįžti į siuntas
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UzsakymoKodoLangas;