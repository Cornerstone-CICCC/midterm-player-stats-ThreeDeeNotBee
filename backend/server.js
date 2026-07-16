require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
app.use(cors())
app.use(express.json())

// Initialize Pool
const pool = new Pool({
  /*user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,*/
  user: 'postgres',
  password: 'Asdfghj.12345',
  host: 'localhost',
  port: 5432,
  database: 'midDB',
})
//
//
//
//CONNECT
//
//
// --- API ENDPOINTS ---
async function connectToDB() {
  try {
    await pool.connect()
    console.log('✅ Connected to PostgreSQL successfully!')
    // 1. GET All
    app.get('/api/performances', async (req, res) => {
      try {
        const result = await pool.query(
          `SELECT r.id, p.player_name, p.team, r.opponent_team, m.match_date, p.position, r.minutes_played, r.goals, r.assists, r.shots, r.pass_accuracy, p.tournament_rating 
          FROM performances AS r 
          LEFT JOIN players AS p ON r.player_id = p.player_id 
          LEFT JOIN matches AS m ON r.match_id = m.match_id 
          ORDER BY player_name ASC`,
        )
        res.json(result.rows)
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })

    // 2. POST Add
    app.post('/api/performances', async (req, res) => {
      let now = Date.now() / (1000 * 60 * 60)
      let playerId = 'p' + (now | 0)
      let matchID = 'm' + (now | 0)
      const {
        player_name,
        team,
        opponent_team,
        match_date,
        position,
        minutes_played,
        goals,
        assists,
        shots,
        pass_accuracy,
        tournament_rating,
      } = req.body
      const query1 = `
                    INSERT INTO players (player_id, player_name, team, position, tournament_rating)
                    VALUES ($1, $2, $3, $4, $5) RETURNING *`
      const query2 = `
                    INSERT INTO matches (match_id, match_date)
                    VALUES ($1, $2) RETURNING *`
      const query3 = `
                    INSERT INTO performances (id, player_id, match_id, opponent_team, minutes_played, goals, shots, pass_accuracy)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`
      try {
        const result = await pool
          .query(query1, [
            playerId,
            player_name,
            team,
            position,
            tournament_rating,
          ])
          .then(await pool.query(query2, [matchID, match_date]))
          .then(
            await pool.query(query3, [
              parseInt(now),
              playerId,
              matchID,
              String(opponent_team),
              parseInt(minutes_played),
              parseInt(goals),
              parseInt(shots),
              parseFloat(pass_accuracy),
            ]),
          )
        res.json(result.rows[0])
      } catch (err) {
        //console.log('error', err)
        res.status(500).json({ error: err.message })
      }
    })

    // 3. PUT Update
    app.put('/api/performances/:id', async (req, res) => {
      const {
        position,
        minutes_played,
        goals,
        assists,
        shots,
        pass_accuracy,
        tournament_rating,
      } = req.body
      const query1 = `
            UPDATE players
            SET position = $1, tournament_rating = $2 
            WHERE player_id ILIKE 'p${req.params.id}' RETURNING *`
      const query2 = `UPDATE performances
            SET minutes_played = $1, goals = $2, assists = $3, shots = $4, pass_accuracy= $5
            WHERE id = $6 RETURNING *`
      try {
        const result = await pool
          .query(query1, [position, tournament_rating])
          .then(
            await pool.query(query2, [
              minutes_played,
              goals,
              assists,
              shots,
              pass_accuracy,
              req.params.id,
            ]),
          )
        res.json(result.rows[0])
      } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
      }
    })

    // 4. DELETE
    app.delete('/api/performances/:id', async (req, res) => {
      try {
        await pool.query('DELETE FROM performances WHERE id = $1', [
          req.params.id,
        ])
        res.json({ message: 'Deleted successfully' })
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })
  } catch (error) {
    // Catch and print any connection errors
    console.error('❌ Connection failed:', error.message)
  } /*finally {
    // 4. Always close the connection when you're done
    await pool.end()
    console.log('🔌 Connection closed.')
  }*/
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
)

connectToDB()
