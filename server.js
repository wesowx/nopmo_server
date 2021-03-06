const express = require('express');
const https = require('https');
const bcrypt = require('bcryptjs');
const knex = require('knex');
const pg = require('pg');
const cors = require('cors');

const app = express();

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cors());


const db = knex({
  client:'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
})

// let db = [
//   {
//     id: 1,
//     username: "wesowx",
//     name: "wes",
//     password: "wes",
//     p: new Date(2020,1,16).getTime(),
//     m: new Date().getTime(),
//     o: new Date().getTime(),
//     fap: 1,
//     joined: new Date(),
//     rank: 'Fapper'
//   }
// ]

app.get('/', (req,res) => console.log('hi'));


app.post(
  '/signin',
  (req,res) => {
    const {username,password} = req.body;
    db('users')
    .where('username',username)
    .then(user => {
      const passwordValidation = bcrypt.compareSync(password, user[0].password);
      if (passwordValidation) {
        res.json(user[0]);
      } else {
        res.status(404).json('no such user');
      }
    })
    .catch(err => res.status(400).json('no such user'))


    // OLD CODE

    // let passwordValidation = bcrypt.compareSync(req.body.password, db[db.length-1].password);
    // if (req.body.username === db[db.length-1].username && passwordValidation) {
    //   res.json(db[db.length-1]);
    // } else {
    //   res.status(404).json('no such user');
    // }
  }
);


app.post('/register', (req,res) => {
  const {name,username,password} = req.body;

  const users = db('users').returning('*');
  const streaks = db('streaks').returning('streakid');
  const user = db('users').where('username',username).returning('*')


  async function register() {
    let hashedPassword = bcrypt.hashSync(password,8);

    let streakid = await streaks.insert({
      username: username,
      startdate: new Date()
    })

    try {
      await users.insert({
        username: username,
        name: name,
        password: hashedPassword,
        p: new Date(),
        m: new Date(),
        o: new Date(),
        joined: new Date(),
        currentstreakid: streakid[0]
      })
    } catch(err) {
      res.status(404).json('Username already taken');
    }

    let sendUser = await user;

    await res.json(sendUser[0]);

  }

  if (!name.length || !username.length || !password.length) {
    res.status(404).json("Do not leave blanks")
  } else {
    register();
    // let hashedPassword = bcrypt.hashSync(password,8);
    // db('users')
    // .returning('*')
    // .insert({
    //   username: username,
    //   name: name,
    //   password: hashedPassword,
    //   p: new Date(),
    //   m: new Date(),
    //   o: new Date(),
    //   joined: new Date()
    // })
    // .then(user => res.json(user[0]))
    // .catch(err => res.status(404).json("Username already taken"))
  }

})


app.post('/reset', (req,res) => {
  const {p,m,o,username,currentstreakid} = req.body;

  const users = db('users').where('username',username).returning('*')
  const logsTable = db('logs').returning('*');
  const streak = db('streaks').where('streakid',currentstreakid).returning('*');
  const streaks = db('streaks').returning('streakid');



  async function reset() {
    if (p) {
      await users.update('p', new Date());
      await logsTable.insert({
        streakid: currentstreakid,
        type: 'reset',
        date: new Date(),
        color: 'orange',
        typeofrelapse: 'p'
      });
    }

    if (m) {
      await users.update('m', new Date());
      await logsTable.insert({
        streakid: currentstreakid,
        type: 'reset',
        date: new Date(),
        color: 'red',
        typeofrelapse: 'm'
      });
    }

    if (o) {
      await logsTable.insert({
        streakid: currentstreakid,
        type: 'reset',
        date: new Date(),
        color: 'black',
        typeofrelapse: 'o'
      });

      await streak.update({
        enddate: new Date()
      });


      let newstreakid = await streaks.insert({
        username: username,
        startdate: new Date()
      });


      await users.update({o:new Date(),currentstreakid:newstreakid[0]}).increment('fap',1);

    }

    await db('users')
    .where('username',username)
    .then(user => res.json(user[0]))
    .catch(err => res.status(404).json(err))

  }

  reset();

})


app.post('/journal', (req,res) => {
  const {username,currentstreakid,mood,confidence,cognition,motivation,productivity,writeup} = req.body;

  const logsTable = db('logs').returning('*');

  async function updateJournal() {
    try {
      await logsTable.insert({
        streakid: currentstreakid,
        type: 'journal',
        date: new Date(),
        mood: mood,
        confidence: confidence,
        cognition: cognition,
        motivation: motivation,
        productivity: productivity,
        writeup: writeup
      });

      res.json('success');
    } catch(err) {
      res.status(404).json(err);
    }

  }

  updateJournal();

})


app.put('/updaterank', (req,res) => {
  const {rank,username} = req.body;

  const users = db('users').where('username',username).returning('*')

  users.update({rank:rank})
  .then(user => res.json(user[0]))
  .catch(err => res.status(404).json(err))

})




app.post('/currentstreak', (req,res) => {
  const {currentstreakid} = req.body;

  const logsTable = db('logs').where('streakid',currentstreakid).returning('*');

  logsTable
  .then(logs => res.json(logs))
  .catch(err => res.status(404).json(err));

})

app.post('/paststreak', (req,res) => {
  const {paststreakid} = req.body;

  const logsTable = db('logs').where('streakid',paststreakid).returning('*');

  logsTable
  .then(logs => res.json(logs))
  .catch(err => res.status(404).json(err));

})

app.post('/paststreaklist', (req,res) => {
  const {username} = req.body;

  const pastStreakList = db('streaks').where('username',username).returning('*');

  pastStreakList
  .then(streaks => res.json(streaks))
  .catch(err => res.status(404).json(err));

})



app.listen(process.env.PORT || 8080, () => {
  console.log(`app is running on port ${process.env.PORT}`)
}
)
