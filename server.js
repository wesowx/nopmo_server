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
      streaknumber: 1,
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
        currentstreakid: streakid
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
  const {p,m,o,username} = req.body;

  const users = db('users').where('username',username).returning('*')
  const logsTable = db('logs').returning('*');


  async function reset() {
    if (p) {
      await users.update('p', new Date())
    }

    if (m) {
      await users.update('m', new Date())
    }

    if (o) {
      await users.update('o', new Date()).increment('fap',1)
    }

    db('users')
    .where('username',username)
    .then(user => res.json(user[0]))
    .catch(err => res.status(404).json(err))

  }

  reset();


})


app.put('/updaterank', (req,res) => {
  const {rank,username} = req.body;

  const users = db('users').where('username',username).returning('*')

  users.update({rank:rank})
  .then(user => res.json(user[0]))
  .catch(err => res.status(404).json(err))

})


app.listen(process.env.PORT || 8080, () => {
  console.log(`app is running on port ${process.env.PORT}`)
}
)
