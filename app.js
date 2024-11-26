const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const firebaseAdmin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const Handlebars = require('handlebars');
const { engine } = require('express-handlebars');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, addDoc, doc, updateDoc, getDoc, deleteDoc } = require('firebase/firestore');

// Inicializa o Firebase Admin SDK
const serviceAccount = require('./firebase-admin.json');
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

// Configuração do Firebase SDK (autenticação do cliente)
const firebaseConfig = {
  apiKey: "AIzaSyAWiAzE1zFBV1kXCitVVBXt3dyMJcNB4S4",
  authDomain: "reservas-109c8.firebaseapp.com",
  projectId: "reservas-109c8",
  storageBucket: "reservas-109c8.firebasestorage.app",
  messagingSenderId: "498372706766",
  appId: "1:498372706766:web:453696fe4e60f481b4eb9f"
};

// Inicializa o Firebase App para autenticação do cliente
const firebaseApp = initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = getFirestore(firebaseApp);

// Configuração do servidor Express
const app = express();

// Configurações do Handlebars
app.engine('handlebars', engine({
  helpers: {
    eq: (a, b) => a === b, // Verifica igualdade
    increment: (index) => index + 1 // Incrementa o índice
  },
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar autenticação
function isAuthenticated(req, res, next) {
  const sessionCookie = req.cookies.session || '';
  firebaseAdmin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then(() => next())
    .catch(() => res.redirect('/'));
}

// Rotas
app.get('/', (req, res) => res.render('fazerLogin'));

app.get('/criarConta', (req, res) => res.render('criarConta'));

app.post('/fazerLogin', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const auth = getAuth(firebaseApp);
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);

    const idToken = await userCredential.user.getIdToken();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias
    const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { expiresIn });

    res.cookie('session', sessionCookie, { maxAge: expiresIn, httpOnly: true });
    res.redirect('/consultar');
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(401).render('fazerLogin', { error: 'Usuário ou senha inválidos.' });
  }
});

app.post('/criarConta', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const auth = getAuth(firebaseApp);
    await createUserWithEmailAndPassword(auth, email, senha);
    res.redirect('/');
  } catch (error) {
    console.error('Erro ao criar conta:', error.message);
    res.status(500).render('criarConta', { error: 'Erro ao criar conta. Tente novamente.' });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('session');
  res.redirect('/');
});

app.get('/consultar', isAuthenticated, async (req, res) => {
  const searchQuery = req.query.search || '';
  let reservasList = [];

  try {
    const reservasSnapshot = await getDocs(
      collection(db, 'reservas') // Busca todas as reservas
    );

    reservasList = reservasSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Ordena as reservas apenas se 'createdAt' estiver presente
    reservasList.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0); // Define como antiga se não existir
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateA - dateB; // Ordenação crescente
    });

    if (searchQuery) {
      reservasList = reservasList.filter(reserva =>
        reserva.id.includes(searchQuery) || reserva.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    res.render('consultar', { reservas: reservasList });
  } catch (error) {
    console.error('Erro ao consultar reservas:', error.message);
    res.status(500).send('Erro ao carregar reservas.');
  }
});

app.get('/criarReserva', isAuthenticated, (req, res) => res.render('criarReserva'));

app.post('/criarReserva', async (req, res) => {
  const { nome, cpf, data, hora, qtd_pessoas } = req.body;
  try {
    const docRef = await addDoc(collection(db, 'reservas'), {
      nome,
      cpf,
      data,
      hora,
      qtd_pessoas,
      status: 'Pendente',
      createdAt: new Date(), // Adiciona o timestamp de criação
    });
    res.redirect('/consultar');
  } catch (error) {
    console.error('Erro ao criar reserva:', error.message);
    res.status(500).send('Erro ao criar reserva. Tente novamente.');
  }
});

app.get('/alterarReserva/:id', isAuthenticated, async (req, res) => {
  const reservaId = req.params.id;
  try {
    const reservaRef = doc(db, 'reservas', reservaId);
    const reservaDoc = await getDoc(reservaRef);
    
    if (!reservaDoc.exists()) {
      return res.status(404).send('Reserva não encontrada.');
    }
    
    res.render('alterarReserva', { reserva: reservaDoc.data(), id: reservaId });
  } catch (error) {
    console.error('Erro ao carregar a reserva:', error.message);
    res.status(500).send('Erro ao carregar a reserva.');
  }
});

app.post('/alterarReserva/:id', isAuthenticated, async (req, res) => {
  const reservaId = req.params.id;
  const { nome, cpf, data, hora, qtd_pessoas } = req.body;

  try {
    const reservaRef = doc(db, 'reservas', reservaId);
    await updateDoc(reservaRef, {
      nome,
      cpf,
      data,
      hora,
      qtd_pessoas,
    });
    res.redirect('/consultar');
  } catch (error) {
    console.error('Erro ao alterar reserva:', error.message);
    res.status(500).send('Erro ao alterar reserva. Tente novamente.');
  }
});

app.post('/removerReserva/:id', isAuthenticated, async (req, res) => {
  const reservaId = req.params.id;
  try {
    const reservaRef = doc(db, 'reservas', reservaId);
    await deleteDoc(reservaRef);
    res.redirect('/consultar');
  } catch (error) {
    console.error('Erro ao remover reserva:', error.message);
    res.status(500).send('Erro ao remover reserva. Tente novamente.');
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});