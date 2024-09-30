const express = require('express');
const mongoose = require('mongoose');

// Konekcija na MongoDB bazu podataka
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/snaga_piksela_blog'; // Lokalno

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));


const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const app = express();




// Postavke za slike
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Model za korisnika
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const User = mongoose.model('User', UserSchema);

// Model za postove
const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', PostSchema);

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Homepage
app.get('/', async (req, res) => {
  const posts = await Post.find().sort({ date: -1 });
  res.render('home', { posts });
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Login Request
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.redirect('/login');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.redirect('/login');

  req.session.isAuth = true;
  res.redirect('/');
});

// Protected Route for Creating Posts
app.get('/post', (req, res) => {
  if (!req.session.isAuth) return res.redirect('/login');
  res.render('post');
});

app.post('/post', upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  const newPost = new Post({
    title,
    content,
    image: req.file ? req.file.filename : null
  });
  await newPost.save();
  res.redirect('/');
});

// 404 Page
app.use((req, res, next) => {
  res.status(404).render('404');
});

// Pokretanje servera
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
