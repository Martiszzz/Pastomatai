import React, { useState, useEffect, useRef } from "react";
import styles from "./IdejimosPatvirtinimasLangas.module.css";
import "./global.css"
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

interface SiuntaInfo {
    siuntosNr: number;
    pastomato_id: number;
    dureliu_id: number;
    lipdukoNr: number;
    kodas: number
}
const PATVIRTINIMO_LAIKAS_SEK = 3 * 60; 

function IdejimosPatvirtinimasLangas() {
    const [likesLaikas, setLikesLaikas] = useState<number>(PATVIRTINIMO_LAIKAS_SEK);
    // const [zinute, setZinute] = useState<string>("");
    // const [busena, setBusena] = useState<"laukiama" | "vykdoma" | "baigta">("laukiama");
    // const vykdomaRef = useRef(false); 
    const [searchParams] = useSearchParams();
    const { siuntosNr } = useParams();
    const navigate = useNavigate();
    const [siuntaInfo,setSiuntaInfo] = useState<SiuntaInfo>({
        siuntosNr:Number(siuntosNr),
        pastomato_id:Number(searchParams.get("pastomato_id")),
        dureliu_id:Number(searchParams.get("dureles")),
        lipdukoNr:Number(searchParams.get("lipdukoNr")),
        kodas:Number(searchParams.get("kodas"))
    });
    useEffect(() => {
        // if (busena !== "laukiama") return;

        const intervalas = setInterval(() => {
            setLikesLaikas((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalas);

                    VykdytiPatvirtinima(0);

                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalas);
    }, /*[busena]*/[]);

    const VykdytiPatvirtinima = async (patvirtinimas: number) => {
        // if (vykdomaRef.current) return;

        // vykdomaRef.current = true;
        // setBusena("vykdoma");

        try {
            const response = await fetch("/api/idejimasPatvirtinti", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    siuntosNr: siuntaInfo.siuntosNr,
                    pastomato_id: siuntaInfo.pastomato_id,
                    patvirtinimas: patvirtinimas,
                }),
            });

            // const data = await response.json();

            // if (data.sekminga) {
            //     setZinute("Siunta sėkmingai įdėta į paštomatą!");
            // } else {
            //     setZinute("Klaida patvirtinant siuntą.");
            // }
        } catch {
            // setZinute("Serverio klaida.");
        } finally {
            // setBusena("baigta");
            navigate("/pastomatas");
            setTimeout(() => 3000);
        }
    };

    const handlePatvirtinti = () => {
        // if (busena === "laukiama") {

            VykdytiPatvirtinima(1);
        // }
    };
    const minutės = Math.floor(likesLaikas / 60);
    const sekundės = likesLaikas % 60;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Patvirtinimas</h1>

            {/* {busena === "baigta" ? (
                <p className={styles.zinute}>{zinute}</p>
            ) : ( */}
                <>
                    <div className={styles.infoBlokasLentele}>
                        <p>
                            <span className={styles.etiketė}>Siuntos Nr.:</span>
                            <strong>{siuntaInfo.kodas}</strong>
                        </p>
                        <p>
                            <span className={styles.etiketė}>Lipduko Nr.:</span>
                            <strong>{siuntaInfo.lipdukoNr}</strong>
                        </p>
                        <p>
                            <span className={styles.etiketė}>Durys Nr.:</span>
                            <strong>{siuntaInfo.dureliu_id}</strong>
                        </p>
                    </div>

                    <p className={styles.instrukcija}>
                        Įdėkite siuntą ir paspauskite <strong>Patvirtinti</strong>.
                    </p>

                    {/* {busena === "laukiama" && ( */}
                        <>
                            <p className={styles.laikmatis}>
                                Automatinis patvirtinimas po:{" "}
                                <strong>
                                    {minutės}:{sekundės.toString().padStart(2, "0")}
                                </strong>
                            </p>
                            <button
                                className={styles.patvirtintiMygtukas}
                                onClick={handlePatvirtinti}
                            >
                                Patvirtinti
                            </button>
                        </>
                    {/* )} */}

                </>
            {/* )} */}
        </div>
    );
}

export default IdejimosPatvirtinimasLangas;
