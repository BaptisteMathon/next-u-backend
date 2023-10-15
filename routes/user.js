'use strict'
const database = require('../utils/database')
const { stringIsAMatch, hashString, generateToken, validateToken } = require('../utils/index')

module.exports = async function (fastify, opts) {
  const log = fastify.log

  // --- GET USER PROFILE ---
  // this route should use the value from "req.userId" to make a query into the "user" table with said userId.
  // the response body should be include the following fields: user.email, user.username and user.token
  // example response:
  // {
  //   user: {
  //     email: 'waldo@gmail.com',
  //     username: 'waldo',
  //     token: '123456'
  //   }
  // }
  fastify.route({
    url: '/api/user',
    method: 'GET',
    preHandler: validateToken,
    handler: async (req, reply) => {
      const user = await database('user').where({
        id: req.userId
      }).first()

      return{
        user: {
          email: user.email,
          username: user.username,
          token: user.token
        }
      }
    }
  })

  // --- SIGN UP ---
  // this route should receive the following fields on the request body: user.username, user.email and user.password
  // using the previous mentioned fields, plus a token generated by the "generateToken" utility method and the hash of the password
  // obtained by using the "hashString" utility method sending the user.password as function parameter, a record should be inserted
  // into the "user" table
  // the response of the request should include: email, username and user's token
  // example response:
  // {
  //   user: {
  //     username: 'admin',
  //     email: 'admin@gmail.com',
  //     token: 'super secret'
  //   }
  // }
  // HINT: remember that all utility methods ( hashString and generateToken ) are asynchronous functions! they need to be used with "await"
  fastify.route({
    url: '/api/users',
    method: 'POST',
    handler: async (req, reply) => {
      const {username, email, password} = req.body.user
      const token = await generateToken()
      const hashedPassword = await hashString(password)
      await database('user').insert({
        username, 
        email,
        password: hashedPassword,
        token
      })
    }
  })

  // --- LOGIN ---
  // this route should receive on the request body only two fields: user.email and user.password
  // the route should first retrieve the user from the database, filtering the SQL query by the email provided
  // once with the user retrieved, you should use the utility method "stringIsAMatch" to compare the password included in the 
  // request body with the password from the user in the database.
  // if the passwords are a match, the response of the request should include: email, user's token and username
  // example response on this case:
  // {
  //   user: {
  //     username: 'henry',
  //     token: '123456',
  //     email: 'henry@gmail.com'
  //   }
  // }
  // if the passwords are NOT a match, the response should have a status code 401 and
  // the request body should have a "message" field with the value "invalid credentials"
  // HINT: remember that all utility methods ( hashString and generateToken ) are asynchronous functions! they need to be used with "await"
  fastify.post('/api/users/login', async function (req, reply) {
    const { email, password } = req.body.user
    const user = await database('user').where({ email }).first()
    const equal = await stringIsAMatch(password, user.password)
    if (!equal) {
      reply.status(401)
      return {
        message: 'Invalid credentials'
      }
    }
    return {
      user: {
        username: user.username,
        token: user.token,
        email: user.email,
      }
    }
  })

  // --- do not modify ---
  fastify.put('/api/user', async (req, reply) => req.body)
  // --- do not modify ---
  fastify.get('/api/profiles/:username', async (req, reply) => {
    const user = await database('user').select(['username', 'bio', 'image']).where({ username: req.params.username }).first()
    return {
      profile: user
    }
  })
}

// postgres://postgresql_baptiste_user:8hzfW3vorBDL58WcynPDGvtI2M3K9rXZ@dpg-ckjv1holk5ic738djrl0-a/postgresql_baptiste
