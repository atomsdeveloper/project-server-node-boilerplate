require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

// Criando conexão com o banco de dados mongoose.
mongoose.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.emit('pronto');
  })
  .catch(e => console.log(e));

const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const routes = require('./routes');

const path = require('path');

const helmet = require('helmet');
const csrf = require('csurf');

const { middlewareGlobal, checkCsrfError, csrfMiddleware } = require('./src/middlewares/middleware');

app.use(helmet());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Resolvendo arquivos estáticos.
app.use(express.static(path.resolve(__dirname, 'public')));

// Usando sessions para salvar os dados no navegador.
const sessionOptions = session({
  secret: process.env.SESSIONSECRET,
  store: MongoStore.create({ mongoUrl: process.env.CONNECTIONSTRING }),
  resave: false,
  saveUninitialized: false,
  // Duração do cookie
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true
  }
});
app.use(sessionOptions);
// Menssagems para serem enviadas e logo após deixarem de existir.
app.use(flash());

// Config views e engine view
app.set('views', path.resolve(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');

// Segurança de formulário
app.use(csrf());

// Middleware Globais para segurança.
app.use(middlewareGlobal);
app.use(checkCsrfError);
app.use(csrfMiddleware);
app.use(routes);

// Só inicia o servidor quando a promise da conexão com o banco emitir o sinal 'pronto'.
app.on('pronto', () => {
  app.listen(process.env.SERVERPORT, () => {
    console.log(`Acessar http://localhost:${process.env.SERVERPORT}`);
    console.log(`Servidor executando na porta ${process.env.SERVERPORT}`);
  });
});