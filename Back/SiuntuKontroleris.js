const pool = require("./src/db");

module.exports = (app) => {

    app.get("/api/siunta/:kodas", async (req, res) => {
        try {
            const { kodas } = req.params;

            const [rows] = await pool.query(
                `SELECT siuntosNr, busena, lipdukoNr, kodas
                 FROM siunta
                 WHERE kodas = ?`,
                [kodas]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    error: "Siunta nerasta"
                });
            }

            res.status(200).json(rows[0]);

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Serverio klaida"
            });
        }
    });

    app.post("/api/siunta/tikrinti-koda", async (req, res) => {
        try {
            const { kodas } = req.body;

            if (!kodas) {
                return res.status(400).json({ error: "Trūksta kodo" });
            }

            const [rows] = await pool.query(
                `SELECT s.siuntosNr, s.busena, s.kodas, s.pastomato_id, s.dureliu_id,
                        d.numeris AS dureliuNumeris
                 FROM siunta s
                 LEFT JOIN dureles d ON s.dureliu_id = d.dureliuId
                 WHERE s.kodas = ?`,
                [kodas]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Siunta nerasta" });
            }

            res.status(200).json({
                rasta: true,
                signalas: "atidaryta",
                siunta: rows[0]
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Serverio klaida" });
        }
    });

    // UPDATED: patvirtinimas + pristatyta jei tikslinis pastomatas sutampa
    app.post("/api/siunta/patvirtinti-isimima", async (req, res) => {
        try {
            const { siuntaId, patvirtinta } = req.body;

            if (!siuntaId) {
                return res.status(400).json({ error: "Trūksta siuntaId" });
            }

            const [rows] = await pool.query(
                `SELECT s.siuntosNr,
                        s.busena,
                        s.pastomato_id AS destinationPastomatas,
                        d.pastomato_id AS currentPastomatas
                 FROM siunta s
                 LEFT JOIN dureles d ON s.dureliu_id = d.dureliuId
                 WHERE s.siuntosNr = ?`,
                [siuntaId]
            );

            if (rows.length === 0) {
                return res.status(404).json({ error: "Siunta nerasta" });
            }

            const siunta = rows[0];
            const sutampa = siunta.destinationPastomatas === siunta.currentPastomatas;

            if (patvirtinta) {
                if (sutampa) {
                    await pool.query(
                        `UPDATE siunta SET busena = ? WHERE siuntosNr = ?`,
                        ["pristatyta", siuntaId]
                    );
                }
            } else {
                await pool.query(
                    `UPDATE siunta SET busena = ? WHERE siuntosNr = ?`,
                    ["nepatvirtinta", siuntaId]
                );
            }

            const [patvRows] = await pool.query(
                `SELECT patvirtinimoId FROM patvirtinimas WHERE siunta_id = ?`,
                [siuntaId]
            );

            if (patvRows.length === 0) {
                await pool.query(
                    `INSERT INTO patvirtinimas (patvirtintasIsiemimas, siunta_id)
                     VALUES (?, ?)`,
                    [patvirtinta ? 1 : 0, siuntaId]
                );
            } else {
                await pool.query(
                    `UPDATE patvirtinimas
                     SET patvirtintasIsiemimas = ?
                     WHERE siunta_id = ?`,
                    [patvirtinta ? 1 : 0, siuntaId]
                );
            }

            if (patvirtinta && siunta.currentPastomatas) {
                await pool.query(
                    `UPDATE pastomatas
                     SET uzimtas = GREATEST(uzimtas - 1, 0)
                     WHERE idNr = ?`,
                    [siunta.currentPastomatas]
                );
            }

            res.status(200).json({
                ok: true,
                patvirtinta,
                pristatyta: patvirtinta && sutampa
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Serverio klaida" });
        }
    });
    // IdėjimoKodaLangasKontrolieris -> SiuntuKontrolieris
    app.post("/api/idejimasPatikrinti", async (req, res) => {

        const connection = await pool.getConnection();

    
        const { kodas } = req.body;

        await connection.beginTransaction();

        const [siuntos] = await connection.query(
            `SELECT s.siuntosNr,
                    s.busena,
                    s.lipdukoNr,
                    s.kodas,
                    s.pastomato_id,
                    s.dureliu_id,
                    p.uzimtas,
                    p.talpa,
                    p.adresas
            FROM siunta s
            JOIN pastomatas p
                ON s.pastomato_id = p.idNr
            WHERE s.kodas = ?`,
            [kodas]
        );

        if (siuntos.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                teigiamas: false,
                klaida: "Siunta nerasta pagal nurodytą kodą",
            });
        }

        const siunta = siuntos[0];

        const { uzimtas, talpa } = siunta;

        const yraVietos = uzimtas < talpa;

        if (!yraVietos) {

            await connection.rollback();

            return res.status(200).json({
                teigiamas: false,
                klaida: "Paštomatas pilnas",
            });
        }

        console.log("SIGNALAS PAŠTOMATUI");

        const [laisvosDureles] = await connection.query(
            `SELECT dureliuId,
                    numeris
            FROM dureles
            WHERE pastomato_id = ?
            AND statusas = 0
            LIMIT 1`,
            [siunta.pastomato_id]
        );

        const dureles = laisvosDureles[0];

        await connection.query(
            `UPDATE siunta
            SET dureliu_id = ?
            WHERE siuntosNr = ?`,
            [dureles.dureliuId, siunta.siuntosNr]
        );

        await connection.query(
            `UPDATE dureles
            SET statusas = 1
            WHERE dureliuId = ?`,
            [dureles.dureliuId]
        );

        console.log(
            `[Siunta ${siunta.siuntosNr}] Priskirtos durelės ID=${dureles.dureliuId}`
        );
        if(siunta.busena==="uzregistruota") console.log("SIGNALAS PAŠTOMATUI SPAUSDINTI KODA");
        await connection.commit();

        return res.status(200).json({
            teigiamas: true,
            siuntosNr: siunta.siuntosNr,
            pastomato_id: siunta.pastomato_id,
            dureliu_id: dureles.dureliuId,
            dureliu_numeris: dureles.numeris,
            lipdukoNr: siunta.lipdukoNr,
        });

    
        connection.release();
    
    });


    // IdėjimoPatvirtinimoLangasKontrolieris -> PaštomataKontrolieris
    app.post("/api/idejimasPatvirtinti", async (req, res) => {

        const connection = await pool.getConnection();

        const {
            siuntosNr,
            patvirtinimas
        } = req.body;

        await connection.beginTransaction();

        const [siuntos] = await connection.query(
            `SELECT s.siuntosNr,
                    s.busena,
                    s.pastomato_id AS paskirties_pastomatas,
                    s.dureliu_id
            FROM siunta s
            WHERE s.siuntosNr = ?`,
            [siuntosNr]
        );

        const siunta = siuntos[0];

        const [dureles] = await connection.query(
            `SELECT d.dureliuId,
                d.pastomato_id
            FROM dureles d
            WHERE d.dureliuId = ?`,
            [siunta.dureliu_id]
        );

        const tikrasPastomatas = dureles[0].pastomato_id;

        const galutinisTikslas =
            siunta.paskirties_pastomatas === tikrasPastomatas;

        if (galutinisTikslas) {

            await connection.query(
                `UPDATE siunta
                SET busena = 'vietoje'
                WHERE siuntosNr = ?`,
                [siuntosNr]
            );

            console.log(
                `[Siunta ${siuntosNr}] Statusas -> 'vietoje'`
            );

        } else {

            await connection.query(
                `UPDATE siunta
                SET busena = 'issiusta'
                WHERE siuntosNr = ?`,
                [siuntosNr]
            );

            console.log(
                `[Siunta ${siuntosNr}] Statusas -> 'issiusta'`
            );
        }

        if (patvirtinimas === 1) {

            await connection.query(
                `INSERT INTO patvirtinimas
                (patvirtintasIdejimas,
                patvirtintasIsiemimas,
                siunta_id)
                VALUES (1, 0, ?)`,
                [siuntosNr]
            );

            await connection.query(
                `UPDATE pastomatas
                SET uzimtas = uzimtas + 1
                WHERE idNr = ?`,
                [tikrasPastomatas]
            );

            console.log(
                `[Paštomatas ${tikrasPastomatas}] Užimtumas padidintas`
            );

            await connection.commit();

            return res.status(200).json({
                sekminga: true,
            });
        }

        else {

           
            await connection.query(
                `INSERT INTO patvirtinimas
                (patvirtintasIdejimas,
                patvirtintasIsiemimas,
                siunta_id)
                VALUES (0, 0, ?)`,
                [siuntosNr]
            );
        
            await connection.query(
                `UPDATE pastomatas
                SET uzimtas = uzimtas + 1
                WHERE idNr = ?`,
                [tikrasPastomatas]
            );

            console.log(
                `[Siunta ${siuntosNr}] Įdėjimas atmestas`
            );

            await connection.commit();

            return res.status(200).json({
                sekminga: false,
            });
        }

       connection.release();
        
    });




        // UzsakymoRegistracijosLangasKontrolieris -> SiuntuKontrolieris
    app.get("/api/pastomatai", async (req, res) => {

        const [pastomatai] = await pool.query(
            `SELECT idNr, adresas
                FROM pastomatas
                ORDER BY adresas ASC`
        );

        return res.status(200).json(pastomatai);

    });

    // UzsakymoRegistracijosLangasKontrolieris -> SiuntuKontrolieris
    app.post("/api/uzsakymas/registruoti", async (req, res) => {
        const connection = await pool.getConnection();

        try {
            const {
                siuntejo_tel_nr,
                gavejo_vardas,
                gavejo_pavarde,
                gavejo_tel_nr,
                gavejo_el_pastas,
                svoris,
                pastomato_id,
                vartotojo_id
            } = req.body;

            if (!siuntejo_tel_nr ||
                !gavejo_vardas ||
                !gavejo_pavarde ||
                !gavejo_tel_nr ||
                !gavejo_el_pastas ||
                !svoris ||
                !pastomato_id ||
                !vartotojo_id) {
                return res.status(400).json({
                    error: "Trūksta užsakymo duomenų"
                });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gavejo_el_pastas)) {
                return res.status(400).json({
                    error: "Neteisingas gavėjo el. pašto formatas"
                });
            }

            if (Number(svoris) <= 0) {
                return res.status(400).json({
                    error: "Svoris turi būti didesnis už 0"
                });
            }

            await connection.beginTransaction();

            const [pastomatai] = await connection.query(
                `SELECT idNr, adresas
                 FROM pastomatas
                 WHERE idNr = ?`,
                [pastomato_id]
            );

            if (pastomatai.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    error: "Pasirinktas paštomatas nerastas"
                });
            }

            const gavejo_adresas = pastomatai[0].adresas;
            const kaina = ApskaiciuotiKaina(Number(svoris));

            const [uzsakymoRezultatas] = await connection.query(
                `INSERT INTO uzsakymas
                (kaina,
                busena,
                svoris,
                siuntejo_tel_nr,
                gavejo_vardas,
                gavejo_pavarde,
                gavejo_tel_nr,
                gavejo_adresas,
                uzsakymo_laikas,
                gavejo_el_pastas,
                vartotojo_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
                [
                    kaina,
                    "neapmoketa",
                    Number(svoris),
                    siuntejo_tel_nr,
                    gavejo_vardas,
                    gavejo_pavarde,
                    gavejo_tel_nr,
                    gavejo_adresas,
                    gavejo_el_pastas,
                    vartotojo_id
                ]
            );

            await connection.commit();

            return res.status(201).json({
                sekminga: true,
                uzsakymoId: uzsakymoRezultatas.insertId,
                kaina: kaina
            });

        } catch (error) {
            await connection.rollback();

            console.error("[uzsakymas/registruoti] klaida:", error);

            return res.status(500).json({
                sekminga: false,
                error: "Serverio klaida"
            });
        } finally {
            connection.release();
        }
    });

    // UzsakymoKodoLangasKontrolieris -> SiuntuKontrolieris
    app.get("/api/uzsakymas/:uzsakymoId", async (req, res) => {
       
        const { uzsakymoId } = req.params;

        const [uzsakymai] = await pool.query(
            `SELECT u.uzsakymoId,
                    u.kaina,
                    u.busena AS uzsakymo_busena,
                    u.svoris,
                    u.gavejo_vardas,
                    u.gavejo_pavarde,
                    u.gavejo_adresas,
                    s.siuntosNr,
                    s.busena AS siuntos_busena,
                    s.kodas
                FROM uzsakymas u
                JOIN siunta s ON s.uzsakymo_id = u.uzsakymoId
                WHERE u.uzsakymoId = ?`,
            [uzsakymoId]
        );

        if (uzsakymai.length === 0) {
            return res.status(404).json({
                error: "Užsakymas arba siunta nerasta"
            });
        }

        return res.status(200).json(uzsakymai[0]);

        
    });

    // Siuntos apmokėjimo metodas
    app.post("/api/siuntos-apmokejimas", async (req, res) => {
        const connection = await pool.getConnection();

        
            const { uzsakymoId } = req.body;

            if (!uzsakymoId) {
                return res.status(400).json({
                    error: "Trūksta užsakymo ID"
                });
            }

            await connection.beginTransaction();

            const [uzsakymai] = await connection.query(
                `SELECT uzsakymoId,
                        kaina,
                        busena,
                        gavejo_adresas
                 FROM uzsakymas
                 WHERE uzsakymoId = ?`,
                [uzsakymoId]
            );

            if (uzsakymai.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    error: "Užsakymas nerastas"
                });
            }

            const uzsakymas = uzsakymai[0];

            console.log(`[Apmokėjimas] Siunčiamas signalas bankininkystės sistemai - Užsakymas: ${uzsakymoId}, Suma: ${uzsakymas.kaina}`);

            const signalasTeigiamas = true;

            if (!signalasTeigiamas) {
                await connection.rollback();

                return res.status(400).json({
                    sekminga: false,
                    error: "Apmokėjimas nepavyko"
                });
            }

            await connection.query(
                `UPDATE uzsakymas
                 SET busena = ?
                 WHERE uzsakymoId = ?`,
                ["apmoketa", uzsakymoId]
            );

            const pastomatoId = await GautiPastomatoIdPagalAdresa(
                connection,
                uzsakymas.gavejo_adresas
            );

            const sukurtaSiunta = await SukurtiSiuntaPoApmokejimo(
                connection,
                uzsakymoId,
                pastomatoId
            );

            await connection.commit();

            return res.status(200).json({
                sekminga: true,
                uzsakymoId: uzsakymoId,
                siuntosNr: sukurtaSiunta.siuntosNr,
                kodas: sukurtaSiunta.kodas
            });


    });

    function ApskaiciuotiKaina(svoris) {
        return Number((svoris * 0.47).toFixed(2));
    }

    async function GautiPastomatoIdPagalAdresa(connection, gavejo_adresas) {
        const [pastomatai] = await connection.query(
            `SELECT idNr
             FROM pastomatas
             WHERE adresas = ?
             LIMIT 1`,
            [gavejo_adresas]
        );

        if (pastomatai.length === 0) {
            throw new Error("Paštomatas nerastas pagal gavėjo adresą");
        }

        return pastomatai[0].idNr;
    }

    async function GeneruotiUnikaluKoda(connection) {
        let kodas;
        let rasta = true;

        while (rasta) {
            kodas = Math.floor(100000 + Math.random() * 900000);

            const [eilutes] = await connection.query(
                `SELECT siuntosNr
                 FROM siunta
                 WHERE kodas = ?
                 LIMIT 1`,
                [kodas]
            );

            rasta = eilutes.length > 0;
        }

        return kodas;
    }

    async function SukurtiSiuntaPoApmokejimo(connection, uzsakymoId, pastomato_id) {
        const [esamosSiuntos] = await connection.query(
            `SELECT siuntosNr,
                    kodas
             FROM siunta
             WHERE uzsakymo_id = ?
             LIMIT 1`,
            [uzsakymoId]
        );

        if (esamosSiuntos.length > 0) {
            return {
                siuntosNr: esamosSiuntos[0].siuntosNr,
                kodas: esamosSiuntos[0].kodas
            };
        }

        const kodas = await GeneruotiUnikaluKoda(connection);

        const [siuntosRezultatas] = await connection.query(
            `INSERT INTO siunta
            (busena,
            kodas,
            pastomato_id,
            uzsakymo_id)
            VALUES (?, ?, ?, ?)`,
            [
                "uzregistruota",
                kodas,
                pastomato_id,
                uzsakymoId
            ]
        );

        return {
            siuntosNr: siuntosRezultatas.insertId,
            kodas: kodas
        };
    }

    // Siuntos peržiūros langas - grąžinti siuntas pagal vartotojo ID
    app.get("/api/siuntos-vartotojo/:vartotojoId", async (req, res) => {
        try {
            const { vartotojoId } = req.params;

            if (!vartotojoId) {
                return res.status(400).json({
                    error: "Trūksta vartotojo ID"
                });
            }

            console.log(`[Siuntos peržiūra] Gautos siuntos vartotojui: ${vartotojoId}`);

            const [siuntos] = await pool.query(
                `SELECT s.siuntosNr, s.busena, s.lipdukoNr, s.kodas, u.uzsakymoId, 
                        u.kaina, u.busena as uzsakymo_busena, u.svoris, u.gavejo_vardas, 
                        u.gavejo_pavarde, u.gavejo_adresas, u.uzsakymo_laikas
                 FROM siunta s
                 JOIN uzsakymas u ON s.uzsakymo_id = u.uzsakymoId
                 WHERE u.vartotojo_id = ?
                 ORDER BY u.uzsakymo_laikas DESC`,
                [parseInt(vartotojoId)]
            );

            console.log(`[Siuntos peržiūra] Rasta siuntų: ${siuntos.length}`);

            res.status(200).json(siuntos);

        } catch (error) {
            console.error("[siuntos-vartotojo] klaida:", error);
            res.status(500).json({
                error: "Serverio klaida"
            });
        }
    });

};
