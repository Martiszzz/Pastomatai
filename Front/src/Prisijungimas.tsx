import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import "./global.css";

function PrisijungimoLangas() {
    const navigate = useNavigate();

    interface userLogin {
        slapyvardis: string,
        slaptazodis: string
    }

    const [vartotojas, setVartotojas] = useState<userLogin>({
        slapyvardis: "",
        slaptazodis: ""
    });

    const [zinute, setZinute] = useState<string>("");

    const handleChange = (c: React.ChangeEvent<HTMLInputElement>) => {
        c.preventDefault();

        const { id, value } = c.target;

        setVartotojas((prev) => ({
            ...prev,
            [id]: value
        }));
    };

    async function PatikrintiDuomenysPilni(c: React.FormEvent<HTMLFormElement>) {
        c.preventDefault();
        if(vartotojas.slaptazodis==""||vartotojas.slapyvardis==""){
            setZinute("Supildyti visus laukus");
        }

        const response = await fetch("api/user/login", {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(vartotojas)
        });

        if (!response.ok) {
            setZinute("Neteisingi prisijungimo duomenys");
            return;
        }

        navigate("/main");
    }

    return (
        <>
            <div className={styles.style}>
                <h1>Prisijungimas</h1>
                <p>{zinute}</p>

                <form onSubmit={PatikrintiDuomenysPilni}>
                    <input
                        id="slapyvardis"
                        type="text"
                        placeholder="Slapyvardis"
                        onChange={handleChange}
                        value={vartotojas.slapyvardis}
                    />

                    <input
                        id="slaptazodis"
                        type="password"
                        placeholder="Slaptažodis"
                        onChange={handleChange}
                        value={vartotojas.slaptazodis}
                    />

                    <button id="submit" type="submit">
                        Prisijungti
                    </button>
                </form>
            </div>
        </>
    );
}

export default PrisijungimoLangas;