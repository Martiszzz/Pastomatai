import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UzsakymoRegistracijosLangas.module.css";
import "./global.css";

interface Pastomatas {
    idNr: number;
    adresas: string;
}

interface Uzsakymas {
    siuntejo_tel_nr: string;
    gavejo_vardas: string;
    gavejo_pavarde: string;
    gavejo_tel_nr: string;
    gavejo_el_pastas: string;
    svoris: string;
    pastomato_id: string;
}

interface SukurtasUzsakymas {
    uzsakymoId: number;
    kaina: number;
}

function UzsakymoRegistracijosLangas() {
    const navigate = useNavigate();

    const [pastomatai, setPastomatai] = useState<Pastomatas[]>([]);
    const [zinute, setZinute] = useState<string>("");
    const [sekme, setSekme] = useState<string>("");
    const [sukurtasUzsakymas, setSukurtasUzsakymas] = useState<SukurtasUzsakymas | null>(null);

    const [uzsakymas, setUzsakymas] = useState<Uzsakymas>({
        siuntejo_tel_nr: "",
        gavejo_vardas: "",
        gavejo_pavarde: "",
        gavejo_tel_nr: "",
        gavejo_el_pastas: "",
        svoris: "",
        pastomato_id: ""
    });

    useEffect(() => {
        const vartotojoId = localStorage.getItem("vartotojoId");

        if (!vartotojoId) {
            navigate("/login");
            return;
        }

        GautiPastomatus();
    }, [navigate]);

    async function GautiPastomatus() {
        try {
            const response = await fetch("/api/pastomatai");

            if (!response.ok) {
                setZinute("Nepavyko gauti paštomatų sąrašo");
                return;
            }

            const data = await response.json();
            setPastomatai(data);
        } catch {
            setZinute("Serverio klaida. Bandykite dar kartą");
        }
    }

    const handleChange = (c: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        c.preventDefault();

        const { id, value } = c.target;

        setUzsakymas((prev) => ({
            ...prev,
            [id]: value
        }));
    };

    function PatikrintiUzpildyma() {
        if (uzsakymas.siuntejo_tel_nr == "" ||
            uzsakymas.gavejo_vardas == "" ||
            uzsakymas.gavejo_pavarde == "" ||
            uzsakymas.gavejo_tel_nr == "" ||
            uzsakymas.gavejo_el_pastas == "" ||
            uzsakymas.svoris == "" ||
            uzsakymas.pastomato_id == "") {
            return false;
        }

        return true;
    }

    function PatikrintiPastas() {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uzsakymas.gavejo_el_pastas);
    }

    function PatikrintiSvori() {
        return Number(uzsakymas.svoris) > 0;
    }

    function ApskaiciuotiKaina() {
        const svoris = Number(uzsakymas.svoris);

        if (!svoris || svoris <= 0) {
            return 0;
        }

        return Number((svoris * 0.47).toFixed(2));
    }

    function GautiPasirinktoPastomatoAdresa() {
        const pasirinktasPastomatas = pastomatai.find(
            (pastomatas) => pastomatas.idNr === Number(uzsakymas.pastomato_id)
        );

        if (!pasirinktasPastomatas) {
            return "";
        }

        return pasirinktasPastomatas.adresas;
    }

    async function PriduotiDuomenis(c: React.FormEvent<HTMLFormElement>) {
        c.preventDefault();

        setZinute("");
        setSekme("");

        if (!PatikrintiUzpildyma()) {
            setZinute("Reikia supildyti visus laukus");
            return;
        }

        if (!PatikrintiPastas()) {
            setZinute("Neteisingas gavėjo el. pašto formatas");
            return;
        }

        if (!PatikrintiSvori()) {
            setZinute("Svoris turi būti didesnis už 0");
            return;
        }

        const vartotojoId = localStorage.getItem("vartotojoId");

        const response = await fetch("/api/uzsakymas/registruoti", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                ...uzsakymas,
                svoris: Number(uzsakymas.svoris),
                pastomato_id: Number(uzsakymas.pastomato_id),
                vartotojo_id: Number(vartotojoId)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setZinute(data.error || "Klaida registruojant užsakymą");
            return;
        }

        setSukurtasUzsakymas({
            uzsakymoId: data.uzsakymoId,
            kaina: data.kaina
        });

        setSekme("Užsakymas išsaugotas. Dabar galite apmokėti siuntą.");
    }

    async function ApmoketiSiunta() {
        if (!sukurtasUzsakymas) {
            setZinute("Pirmiausia reikia išsaugoti užsakymą");
            return;
        }

        setZinute("");
        setSekme("");

        const response = await fetch("/api/siuntos-apmokejimas", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                uzsakymoId: sukurtasUzsakymas.uzsakymoId,
                pastomato_id: Number(uzsakymas.pastomato_id)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            setZinute(data.error || "Apmokėjimas nepavyko. Bandykite dar kartą");
            setSekme("Užsakymas išsaugotas, todėl galite bandyti apmokėti dar kartą.");
            return;
        }

        navigate(`/uzsakymas/kodas/${data.uzsakymoId}`);
    }

    function griztiAtgal() {
        navigate("/siuntos");
    }

    return (
        <div className={styles.container}>
            <h1>Registruoti užsakymą</h1>

            {zinute && <p className={styles.klaida}>{zinute}</p>}
            {sekme && <p className={styles.sekme}>{sekme}</p>}

            <form onSubmit={PriduotiDuomenis} className={styles.forma}>
                <input
                    id="siuntejo_tel_nr"
                    type="text"
                    placeholder="Siuntėjo tel. nr."
                    onChange={handleChange}
                    value={uzsakymas.siuntejo_tel_nr}
                    disabled={sukurtasUzsakymas !== null}
                />

                <div className={styles.eilute}>
                    <input
                        id="gavejo_vardas"
                        type="text"
                        placeholder="Gavėjo vardas"
                        onChange={handleChange}
                        value={uzsakymas.gavejo_vardas}
                        disabled={sukurtasUzsakymas !== null}
                    />

                    <input
                        id="gavejo_pavarde"
                        type="text"
                        placeholder="Gavėjo pavardė"
                        onChange={handleChange}
                        value={uzsakymas.gavejo_pavarde}
                        disabled={sukurtasUzsakymas !== null}
                    />
                </div>

                <input
                    id="gavejo_tel_nr"
                    type="text"
                    placeholder="Gavėjo tel. nr."
                    onChange={handleChange}
                    value={uzsakymas.gavejo_tel_nr}
                    disabled={sukurtasUzsakymas !== null}
                />

                <input
                    id="gavejo_el_pastas"
                    type="text"
                    placeholder="Gavėjo el. paštas"
                    onChange={handleChange}
                    value={uzsakymas.gavejo_el_pastas}
                    disabled={sukurtasUzsakymas !== null}
                />

                <input
                    id="svoris"
                    type="number"
                    step="0.01"
                    placeholder="Svoris kg"
                    onChange={handleChange}
                    value={uzsakymas.svoris}
                    disabled={sukurtasUzsakymas !== null}
                />

                <select
                    id="pastomato_id"
                    onChange={handleChange}
                    value={uzsakymas.pastomato_id}
                    className={styles.select}
                    disabled={sukurtasUzsakymas !== null}
                >
                    <option value="">Pasirinkite gavėjo paštomatą</option>
                    {pastomatai.map((pastomatas) => (
                        <option key={pastomatas.idNr} value={pastomatas.idNr}>
                            {pastomatas.adresas}
                        </option>
                    ))}
                </select>

                {GautiPasirinktoPastomatoAdresa() && (
                    <div className={styles.adresoLaukas}>
                        Gavėjo adresas: {GautiPasirinktoPastomatoAdresa()}
                    </div>
                )}

                <div className={styles.kaina}>
                    Apskaičiuota kaina: {ApskaiciuotiKaina().toFixed(2)} €
                </div>

                <div className={styles.mygtukai}>
                    <button type="submit" disabled={sukurtasUzsakymas !== null}>
                        Išsaugoti
                    </button>

                    {sukurtasUzsakymas && (
                        <button type="button" onClick={ApmoketiSiunta}>
                            Apmokėti siuntą
                        </button>
                    )}

                    <button type="button" onClick={griztiAtgal} className={styles.atgalMygtukas}>
                        Atgal
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UzsakymoRegistracijosLangas;