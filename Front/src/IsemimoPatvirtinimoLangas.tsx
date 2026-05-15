import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./global.css";

function IsemimoPatvirtinimoLangas() {
    const { siuntaId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const dureliuNumeris = searchParams.get("dureles");

    const [zinute, setZinute] = useState("Durėlės atidarytos. Patvirtinkite išėmimą.");
    const [laukiama, setLaukiama] = useState(false);
    const [veiksmasAtliktas, setVeiksmasAtliktas] = useState(false);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        timerRef.current = window.setTimeout(() => {
            if (!veiksmasAtliktas) {
                atliktiPatvirtinima(true, true); // auto-confirm
            }
        }, 3 * 60 * 1000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [veiksmasAtliktas, siuntaId]);

    async function atliktiPatvirtinima(patvirtinta: boolean, auto = false) {
        if (veiksmasAtliktas) return;

        setVeiksmasAtliktas(true);
        if (timerRef.current) clearTimeout(timerRef.current);

        try {
            setLaukiama(true);
            const response = await fetch("/api/siunta/patvirtinti-isimima", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ siuntaId: Number(siuntaId), patvirtinta })
            });

            if (!response.ok) {
                throw new Error("Nepavyko patvirtinti");
            }

            setZinute(
                auto
                    ? "Automatiškai patvirtinta po 3 min."
                    : patvirtinta
                        ? "Išėmimas patvirtintas."
                        : "Išėmimas nepatvirtintas."
            );

            navigate("/pastomatas");
        } catch {
            setZinute("Klaida patvirtinant.");
        } finally {
            setLaukiama(false);
        }
    }

    return (
        <div style={{ padding: "40px" }}>
            <h1>Patvirtinimas</h1>
            <p>Atidarytos durelės: {dureliuNumeris ?? "—"}</p>
            <p>{zinute}</p>

            <button disabled={laukiama} onClick={() => atliktiPatvirtinima(true)}>
                Patvirtinti išėmimą
            </button>
            <button disabled={laukiama} onClick={() => atliktiPatvirtinima(false)}>
                Nepatvirtinti
            </button>
        </div>
    );
}

export default IsemimoPatvirtinimoLangas;