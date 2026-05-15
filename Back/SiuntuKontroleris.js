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

};