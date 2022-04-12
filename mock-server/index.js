const ex = require('express')
const app = ex()

app.get('/', (req, res) => {
  return res.send({ name: 'Bond, James Bond.' })
})

app.listen(3000, () => {
  console.log('server is up')
})