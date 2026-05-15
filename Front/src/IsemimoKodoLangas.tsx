import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./global.css";

function IsemimoKodoLangas() {
    const [kodas, setKodas] = useState("");
    const [zinute, setZinute] = useState("");
    const navigate = useNavigate();

    async function patikrintiKoda(e: React.FormEvent) {
        e.preventDefault();

        try {
            const response = await fetch("/api/siunta/tikrinti-koda", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ kodas })
            });

            if (!response.ok) {
                throw new Error("Neteisingas kodas");
            }

            const data = await response.json();

            navigate(`/pastomatas/isemimo-patvirtinimas/${data.siunta.siuntosNr}?dureles=${data.siunta.dureliuNumeris}`);
        } catch {
            setZinute("Neteisingas kodas");
        }
    }

    return (
        <div style={{ padding: "40px" }}>
            <h1>Įveskite išėmimo kodą</h1>
            <p>{zinute}</p>
            <form onSubmit={patikrintiKoda}>
                <input
                    type="text"
                    placeholder="Išėmimo kodas"
                    value={kodas}
                    onChange={(e) => setKodas(e.target.value)}
                />
                <button type="submit">Gerai</button>
            </form>
        </div>
    );
}

export default IsemimoKodoLangas;