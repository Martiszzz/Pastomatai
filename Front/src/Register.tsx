import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import "./global.css";

function RegistracijosLangas(){
    const navigate = useNavigate();
    interface user{
        slapyvardis : string,
        slaptazodis : string
        vardas : string,
        pavarde : string,
        pastas : string
    };
    const [vartotojas,setVartotojas] = useState<user>({
        slapyvardis : "",
        slaptazodis : "",
        vardas : "",
        pavarde : "",
        pastas : ""
    });
    const [zinute,setZinute] = useState<string>("");
    const handleChange = (c:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>{
        c.preventDefault();
        const {id,type,value} = c.target;
        let finalValue = value;
        if(type ==="text"){
            finalValue = String(value);
        }
        setVartotojas((prev)=>({
            ...prev,
            [id] : finalValue
        }));
        
    }
    async function PriduotiDuomenis(c:React.SubmitEvent<HTMLFormElement>){
        c.preventDefault();
        if(!PatikrintiUzpildyma()) { setZinute("Reikia supildyti visus laukus");return;}
        const response = await fetch("api/user/create",{
            method:"POST",
            headers : {
                "content-type":"application/json"
            },
            body: JSON.stringify(vartotojas)
        });
        if(!response.ok){
            setZinute("Klaida");
            return;
        }
        navigate('/main');
    }
    function PatikrintiUzpildyma(){
        if(vartotojas.pastas==""||vartotojas.pavarde==""||vartotojas.slaptazodis==""||vartotojas.slapyvardis==""||vartotojas.vardas==""){
            return false;
        }
        else return true;
    }
    return (
        <>
        <div className={styles.style}>
            <h1>Registracija</h1>
            <p>{zinute}</p>
            <form onSubmit={PriduotiDuomenis}>
                <input id = "slapyvardis" type = "text" placeholder="Slapyvardis" onChange={handleChange} value={vartotojas.slapyvardis}/>
                
                <input id = "slaptazodis" type = "password" placeholder="Slaptazodis" onChange={handleChange} value={vartotojas.slaptazodis}/>
                <input id = "vardas" type = "text" placeholder="Vardas" onChange={handleChange} value={vartotojas.vardas}/>
                <input id = "pavarde" type = "text" placeholder="Pavarde" onChange={handleChange} value={vartotojas.pavarde}/>

                <input id ="pastas" type = "text" placeholder = "El.Pastas" onChange= {handleChange} value = {vartotojas.pastas}/>
                
                <button id = "submit" type="submit">Išsaugoti</button>
                
            </form>
        </div>
        </>
    )
}
export default RegistracijosLangas