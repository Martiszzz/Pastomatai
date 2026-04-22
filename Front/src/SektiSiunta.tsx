import React, { useState } from "react";
import styles from "./Register.module.css";
import "./global.css";

function SiuntuSekimoLangas() {
    interface siuntaType {
        kodas: string;
    }

    interface resultType {
        siuntosNr: number;
        busena: string;
        lipdukoNr: number;
        kodas: number;
    }

    const [siunta, setSiunta] = useState<siuntaType>({
        kodas: ""
    });

    const [rezultatas, setRezultatas] = useState<resultType | null>(null);
    const [zinute, setZinute] = useState<string>("");

    const handleChange = (c: React.ChangeEvent<HTMLInputElement>) => {
        c.preventDefault();

        const { id, value } = c.target;

        setSiunta((prev) => ({
            ...prev,
            [id]: value
        }));
    };

    async function PateikiamasKodas(c: React.FormEvent<HTMLFormElement>) {
        c.preventDefault();

        setZinute("");
        setRezultatas(null);

        const response = await fetch(`/api/siunta/${siunta.kodas}`);

        if (!response.ok) {
            setZinute("Siunta nerasta");
            return;
        }

        const data = await response.json();
        setRezultatas(data);
    }

    return (
        <>
            <div className={styles.style}>
                <h1>Sekti siuntą</h1>
                <p>{zinute}</p>

                <form onSubmit={PateikiamasKodas}>
                    <input
                        id="kodas"
                        type="text"
                        placeholder="Įveskite siuntos numerį"
                        onChange={handleChange}
                        value={siunta.kodas}
                    />

                    <button type="submit">
                        Ieškoti
                    </button>
                </form>

                {rezultatas && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Siuntos informacija</h3>
                        <p><b>Siuntos Nr:</b> {rezultatas.siuntosNr}</p>
                        <p><b>Būsena:</b> {rezultatas.busena}</p>
                        <p><b>Lipduko Nr:</b> {rezultatas.lipdukoNr}</p>
                        <p><b>Kodas:</b> {rezultatas.kodas}</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default SiuntuSekimoLangas;