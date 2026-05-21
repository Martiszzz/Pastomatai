import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UzsakymoRegistracijosLangas.module.css";
import "./global.css";

interface Pastomatas {
    idNr: number;
    adresas: string;
}

interface UzsakymoForma {
    siuntejo_tel_nr: string;
    gavejo_vardas: string;
    gavejo_pavarde: string;
    gavejo_tel_nr: string;
    gavejo_el_pastas: string;
    svoris: string;
    pastomato_id: string;
}

function UzsakymoRegistracijosLangas() {
    const navigate = useNavigate();

    const [pastomatai, setPastomatai] = useState<Pastomatas[]>([]);
    const [zinute, setZinute] = useState<string>("");
    const [sekme, setSekme] = useState<string>("");
    const [sukurtasUzsakymoId, setSukurtasUzsakymoId] = useState<number | null>(null);

    const [uzsakymas, setUzsakymas] = useState<UzsakymoForma>({
        siuntejo_tel_nr: "",
        gavejo_vardas: "",
        gavejo_pavarde: "",
        gavejo_tel_nr: "",
        gavejo_el_pastas: "",
        svoris: "",
        pastomato_id: ""
    });

    useEffect(() => {
        GautiPastomatus();
    }, []);

    async function GautiPastomatus() {
        const response = await fetch("/api/pastomatai");
        const data = await response.json();

        setPastomatai(data);
    }

    function SuvestiInformacija(c: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { id, value } = c.target;

        setUzsakymas((prev) => ({
            ...prev,
            [id]: value
        }));
    }

    function KlaidosZinute(tekstas: string) {
        setZinute(tekstas);
        setSekme("");
    }

    function SekmesPranesimas(tekstas: string) {
        setSekme(tekstas);
        setZinute("");
    }

    function PatikrintiDuomenis() {
        const vartotojoId = localStorage.getItem("vartotojoId");

        if (!vartotojoId) {
            KlaidosZinute("Vartotojas neprisijungęs");
            return false;
        }

        if (
            uzsakymas.siuntejo_tel_nr === "" ||
            uzsakymas.gavejo_vardas === "" ||
            uzsakymas.gavejo_pavarde === "" ||
            uzsakymas.gavejo_tel_nr === "" ||
            uzsakymas.gavejo_el_pastas === "" ||
            uzsakymas.svoris === "" ||
            uzsakymas.pastomato_id === ""
        ) {
            KlaidosZinute("Reikia supildyti visus laukus");
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uzsakymas.gavejo_el_pastas)) {
            KlaidosZinute("Neteisingas gavėjo el. pašto formatas");
            return false;
        }

        if (Number(uzsakymas.svoris) <= 0) {
            KlaidosZinute("Svoris turi būti didesnis už 0");
            return false;
        }

        return true;
    }

    function PatikrintiSignala(response: Response) {
        return response.ok;
    }

    async function PateiktiDuomenis(c: React.FormEvent<HTMLFormElement>) {
        c.preventDefault();

        if (!PatikrintiDuomenis()) {
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
            KlaidosZinute(data.error || "Klaida registruojant užsakymą");
            return;
        }

        setSukurtasUzsakymoId(data.uzsakymoId);
        SekmesPranesimas(`Užsakymas išsaugotas. Kaina: ${Number(data.kaina).toFixed(2)} €. Dabar galite apmokėti siuntą.`);
    }

    async function ApmoketiSiunta() {
        if (sukurtasUzsakymoId === null) {
            KlaidosZinute("Pirmiausia reikia išsaugoti užsakymą");
            return;
        }

        const response = await fetch("/api/siuntos-apmokejimas", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                uzsakymoId: sukurtasUzsakymoId
            })
        });

        const data = await response.json();

        if (!PatikrintiSignala(response)) {
            KlaidosZinute(data.error || "Apmokėjimas nepavyko");
            return;
        }

        navigate(`/uzsakymas/kodas/${data.uzsakymoId}`);
    }

    function GriztiAtgal() {
        navigate("/siuntos");
    }

    return (
        <div className={styles.container}>
            <h1>Registruoti užsakymą</h1>

            {zinute && <p className={styles.klaida}>{zinute}</p>}
            {sekme && <p className={styles.sekme}>{sekme}</p>}

            <form onSubmit={PateiktiDuomenis} className={styles.forma}>
                <input
                    id="siuntejo_tel_nr"
                    type="text"
                    placeholder="Siuntėjo tel. nr."
                    onChange={SuvestiInformacija}
                    value={uzsakymas.siuntejo_tel_nr}
                    disabled={sukurtasUzsakymoId !== null}
                />

                <div className={styles.eilute}>
                    <input
                        id="gavejo_vardas"
                        type="text"
                        placeholder="Gavėjo vardas"
                        onChange={SuvestiInformacija}
                        value={uzsakymas.gavejo_vardas}
                        disabled={sukurtasUzsakymoId !== null}
                    />

                    <input
                        id="gavejo_pavarde"
                        type="text"
                        placeholder="Gavėjo pavardė"
                        onChange={SuvestiInformacija}
                        value={uzsakymas.gavejo_pavarde}
                        disabled={sukurtasUzsakymoId !== null}
                    />
                </div>

                <input
                    id="gavejo_tel_nr"
                    type="text"
                    placeholder="Gavėjo tel. nr."
                    onChange={SuvestiInformacija}
                    value={uzsakymas.gavejo_tel_nr}
                    disabled={sukurtasUzsakymoId !== null}
                />

                <input
                    id="gavejo_el_pastas"
                    type="text"
                    placeholder="Gavėjo el. paštas"
                    onChange={SuvestiInformacija}
                    value={uzsakymas.gavejo_el_pastas}
                    disabled={sukurtasUzsakymoId !== null}
                />

                <input
                    id="svoris"
                    type="number"
                    step="0.01"
                    placeholder="Svoris kg"
                    onChange={SuvestiInformacija}
                    value={uzsakymas.svoris}
                    disabled={sukurtasUzsakymoId !== null}
                />

                <select
                    id="pastomato_id"
                    onChange={SuvestiInformacija}
                    value={uzsakymas.pastomato_id}
                    className={styles.select}
                    disabled={sukurtasUzsakymoId !== null}
                >
                    <option value="">Pasirinkite gavėjo paštomatą</option>
                    {pastomatai.map((pastomatas) => (
                        <option key={pastomatas.idNr} value={pastomatas.idNr}>
                            {pastomatas.adresas}
                        </option>
                    ))}
                </select>

                <div className={styles.mygtukai}>
                    <button type="submit" disabled={sukurtasUzsakymoId !== null}>
                        Išsaugoti
                    </button>

                    {sukurtasUzsakymoId !== null && (
                        <button type="button" onClick={ApmoketiSiunta}>
                            Apmokėti siuntą
                        </button>
                    )}

                    <button type="button" onClick={GriztiAtgal} className={styles.atgalMygtukas}>
                        Atgal
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UzsakymoRegistracijosLangas;