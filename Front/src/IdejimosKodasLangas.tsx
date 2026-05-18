import React, { useState, useEffect } from "react";
import styles from "./IdejimosKodasLangas.module.css";
import { useNavigate } from "react-router-dom";
import "./global.css"

function IdejimosKodasLangas() {
    const [kodas, setKodas] = useState<string>("");
    const [zinute, setZinute] = useState<string>("");
    // const [kraunama, setKraunama] = useState<boolean>(false);
    const navigate = useNavigate();
    useEffect(() => {
        console.log("[IdejimosKodasLangas] Įdėjimo lango signalas");
    }, []);

    const handleKodasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKodas(e.target.value);
        setZinute("");
    };

    const SiuntosTikrinimas = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setZinute("");

        try {
            const response = await fetch("/api/idejimasPatikrinti", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kodas: Number(kodas) }),
            });

            const data = await response.json();

            if (!data.teigiamas) {
                setZinute(data.klaida || "Neteisingas kodas arba siunta negali būti įdėta");
            } else {
                
                navigate(`/pastomatas/idejimo-patvirtinimas/${data.siuntosNr}`+`?dureles=${data.dureliu_id}`+`&pastomato_id=${data.pastomato_id}`+`&lipdukoNr=${data.lipdukoNr}`+`&kodas=${kodas}`);
        
            }
        } catch {
            setZinute("Serverio klaida. Bandykite dar kartą.");
        } finally {
            // setKraunama(false);
        }
        
    };
    function atgal(){
            navigate("/pastomatas");
        }
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Siuntos įdėjimas</h1>
            <p className={styles.instrukcija}>Įveskite siuntos kodą</p>

            {zinute && <p className={styles.klaida}>{zinute}</p>}

            <form onSubmit={SiuntosTikrinimas} className={styles.forma}>
                <input
                    id="kodas"
                    type="number"
                    placeholder="Kodas"
                    value={kodas}
                    onChange={handleKodasChange}
                    className={styles.ivestis}
                    autoFocus
                />
                <button
                    type="submit"
                    className={styles.mygtukas}
                    >
                        Tikrinti
                </button>
                <button
                    type="button"
                    className={styles.atgalMygtukas}
                    onClick={atgal}
                >
                    Atgal
                </button>
            </form>
        </div>
    );
}

export default IdejimosKodasLangas;
