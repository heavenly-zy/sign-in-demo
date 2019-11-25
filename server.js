var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)

  if (path === '/') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`二哈`)
    response.end()
  } else if (path === '/sign_up' && method === 'GET') {
    response.statusCode = 200
    const string = fs.readFileSync('./public/sign_up.html')
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&') // ['email=1', 'password=2', 'password_confirmation=3']
      let hash = {}
      strings.forEach((string) => {
        let parts = string.split('=') // ['email', '1']
        let key = parts[0]
        let value = parts[1]
        hash[key] = decodeURIComponent(value) // hash['email'] = '1'
      })
      let { email, password, password_confirmation } = hash
      if (email.indexOf('@') === -1) { // 用户输入邮箱中不存在'@'字符
        response.statusCode = 400
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
        response.write(`{
          "errors": {
            "email": "invalid"
          }
        }`)
      } else if (password !== password_confirmation) { // 用户两次输入密码不一致
        response.statusCode = 400
        response.write('Password not match!')
      } else {
        let users = fs.readFileSync('./db/users.json', 'utf8')
        users = JSON.parse(users) // []
        let userExist = false
        // 判断用户是否已存在
        for (let i = 0; i < users.length; i++) {
          let user = users[i]
          if (user.email === email) {
            userExist = true
            break
          }
        }
        if (userExist) { // 用户已存在
          response.statusCode = 400
          response.setHeader('Content-Type', 'text/json;charset=utf-8')
          response.write(`{
            "errors": {
              "email": "exist"
            }
          }`)
        } else {
          users.push({ email: email, password: password })
          let usersString = JSON.stringify(users)
          fs.writeFileSync('./db/users.json', usersString)
          response.statusCode = 200
        }
      }
      response.end()
    })
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`你输入的路径不存在对应的内容`)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      resolve(body)
    })
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)


