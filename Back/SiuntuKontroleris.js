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

        try {

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

            // if (laisvosDureles.length === 0) {

            //     await connection.rollback();

            //     return res.status(200).json({
            //         teigiamas: false,
            //         klaida: "Nerasta laisvų durelių",
            //     });
            // }

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

        } catch (error) {

            await connection.rollback();

            console.error(
                "[idejimasPatikrinti] klaida:",
                error
            );

            return res.status(500).json({
                teigiamas: false,
                klaida: "Serverio klaida",
            });

        } finally {

            connection.release();
        }
    });


    // IdėjimoPatvirtinimoLangasKontrolieris -> PaštomataKontrolieris
    app.post("/api/idejimasPatvirtinti", async (req, res) => {

        const connection = await pool.getConnection();

        try {

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

            // if (siuntos.length === 0) {

            //     await connection.rollback();

            //     return res.status(404).json({
            //         sekminga: false,
            //         klaida: "Siunta nerasta",
            //     });
            // }

            const siunta = siuntos[0];

            const [dureles] = await connection.query(
                `SELECT d.dureliuId,
                    d.pastomato_id
                FROM dureles d
                WHERE d.dureliuId = ?`,
                [siunta.dureliu_id]
            );

            // if (dureles.length === 0) {

            //     await connection.rollback();

            //     return res.status(404).json({
            //         sekminga: false,
            //         klaida: "Durelės nerastos",
            //     });
            // }

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

            const [esamas] = await connection.query(
                `SELECT patvirtinimoId
                FROM patvirtinimas
                WHERE siunta_id = ?`,
                [siuntosNr]
            );

            if (patvirtinimas === 1) {

                if (esamas.length > 0) {

                    await connection.query(
                        `UPDATE patvirtinimas
                        SET patvirtintasIdejimas = 1
                        WHERE siunta_id = ?`,
                        [siuntosNr]
                    );

                } else {

                    await connection.query(
                        `INSERT INTO patvirtinimas
                        (patvirtintasIdejimas,
                        patvirtintasIsiemimas,
                        siunta_id)
                        VALUES (1, 0, ?)`,
                        [siuntosNr]
                    );
                }

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

                if (esamas.length > 0) {

                    await connection.query(
                        `UPDATE patvirtinimas
                        SET patvirtintasIdejimas = 0
                        WHERE siunta_id = ?`,
                        [siuntosNr]
                    );

                } else {

                    await connection.query(
                        `INSERT INTO patvirtinimas
                        (patvirtintasIdejimas,
                        patvirtintasIsiemimas,
                        siunta_id)
                        VALUES (0, 0, ?)`,
                        [siuntosNr]
                    );
                }
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

        } catch (error) {

            await connection.rollback();

            console.error(
                "[idejimasPatvirtinti] klaida:",
                error
            );

            return res.status(500).json({
                sekminga: false,
                klaida: "Serverio klaida",
            });

        } finally {
            connection.release();
        }
    });




        // UzsakymoRegistracijosLangasKontrolieris -> SiuntuKontrolieris
    app.get("/api/pastomatai", async (req, res) => {
        try {
            const [pastomatai] = await pool.query(
                `SELECT idNr, adresas
                 FROM pastomatas
                 ORDER BY adresas ASC`
            );

            return res.status(200).json(pastomatai);

        } catch (error) {
            console.error("[pastomatai] klaida:", error);
            return res.status(500).json({
                error: "Serverio klaida"
            });
        }
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

            if (!PatikrintiEmail(gavejo_el_pastas)) {
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

            const uzsakymoId = uzsakymoRezultatas.insertId;
            const kodas = await GeneruotiUnikaluKoda(connection, "kodas");
            const lipdukoNr = await GeneruotiUnikaluKoda(connection, "lipdukoNr");

            const [siuntosRezultatas] = await connection.query(
                `INSERT INTO siunta
                (busena,
                lipdukoNr,
                kodas,
                pastomato_id,
                uzsakymo_id)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    "uzregistruota",
                    lipdukoNr,
                    kodas,
                    pastomato_id,
                    uzsakymoId
                ]
            );

            await connection.commit();

            return res.status(201).json({
                sekminga: true,
                uzsakymoId: uzsakymoId,
                siuntosNr: siuntosRezultatas.insertId,
                kodas: kodas,
                lipdukoNr: lipdukoNr,
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
        try {
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
                        s.lipdukoNr,
                        s.kodas
                 FROM uzsakymas u
                 JOIN siunta s ON s.uzsakymo_id = u.uzsakymoId
                 WHERE u.uzsakymoId = ?`,
                [uzsakymoId]
            );

            if (uzsakymai.length === 0) {
                return res.status(404).json({
                    error: "Užsakymas nerastas"
                });
            }

            return res.status(200).json(uzsakymai[0]);

        } catch (error) {
            console.error("[uzsakymas/:uzsakymoId] klaida:", error);
            return res.status(500).json({
                error: "Serverio klaida"
            });
        }
    });

    function ApskaiciuotiKaina(svoris) {
        return Number((svoris * 0.47).toFixed(2));
    }

    function PatikrintiEmail(pastas) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pastas);
    }

    async function GeneruotiUnikaluKoda(connection, stulpelis) {
        let kodas;
        let rasta = true;

        while (rasta) {
            kodas = Math.floor(100000 + Math.random() * 900000);

            const [eilutes] = await connection.query(
                `SELECT siuntosNr
                 FROM siunta
                 WHERE ${stulpelis} = ?
                 LIMIT 1`,
                [kodas]
            );

            rasta = eilutes.length > 0;
        }

        return kodas;
    }

    // Apmoketi siunta
    app.post("/api/siuntos-apmokejimas", async (req, res) => {
        const connection = await pool.getConnection();
        
        const { uzsakymoId } = req.body;

        await connection.beginTransaction();

        // Tikrinti uzsakyma
        const [uzsakymai] = await connection.query(
            `SELECT uzsakymoId, kaina, busena FROM uzsakymas WHERE uzsakymoId = ?`,
            [uzsakymoId]
        );

        const uzsakymas = uzsakymai[0];

        //console.log(`[Apmokėjimas] Siunčiamas signalas bankininkystės sistemai - Užsakymas: ${uzsakymoId}, Suma: ${uzsakymas.kaina}`);

        // Atnaujinti uzsakymo busena i "apmoketa"
        await connection.query(
            `UPDATE uzsakymas SET busena = ? WHERE uzsakymoId = ?`,
            ["apmoketa", uzsakymoId]
        );

        //console.log(`[Apmokėjimas] Užsakymas ${uzsakymoId} pažymėtas apmokėtu`);

        await connection.commit();

        //jei neigiamas if
        if(res.status != 200){
            return res.status(500).json({
                sekminga: false,
                uzsakymoId: uzsakymoId
            })
        }
        //jei teigiamas if
        else{ //200 - success code
            return res.status(200).json({ 
            sekminga: true,
            uzsakymoId: uzsakymoId
        });
        }

        connection.release();
    });

    // Siuntos perziuros langas - grazinti siuntas pagal vartID
    app.get("/api/siuntos-vartotojo/:vartotojoId", async (req, res) => {
        const { vartotojoId } = req.params;

        //console.log(`[Siuntos peržiūra] Gautos siuntos vartotojui: ${vartotojoId}`);

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

        //console.log(`[Siuntos peržiūra] Rasta siuntų: ${siuntos.length}`);

        res.status(200).json(siuntos);

    });

};
