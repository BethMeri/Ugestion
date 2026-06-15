const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 👈 ¡NUEVO 1: Agregamos la librería de los tokens aquí!

// Inicializamos la aplicación
const app = express();
const port = 3000;

// Middlewares (Los escudos básicos)
app.use(cors()); // Permite que tu frontend en React se comunique con este backend
app.use(express.json()); // Permite que el servidor entienda la información que le enviemos en formato JSON

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Cambia esto si tu usuario de MySQL es diferente (ej. en XAMPP suele ser 'root')
    password: '', // Pon tu contraseña de MySQL aquí (si usas XAMPP, déjalo vacío)
    database: 'ugestion_seguridad' // ¡El nombre oficial de tu proyecto!
});

// Probando la conexión
db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conexión exitosa a la base de datos UGestión');
});

// Nuestra primera ruta de prueba
app.get('/', (req, res) => {
    res.send('¡El servidor de UGestión está vivo y seguro! 🚀🔒');
});

// Ruta para registrar usuarios (Tachando el requisito de Hash Seguro)
app.post('/api/registro', async (req, res) => {
    // 1. Atrapamos los datos que nos enviará tu frontend en React
    const { nombre, correo, password, rol } = req.body;

    try {
        // 2. Aplicamos la magia de la seguridad (El Hash)
        // El número 10 define las "vueltas" de encriptación (más alto = más seguro pero más lento)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Preparamos el código SQL para guardar el usuario
        // Usamos los signos de interrogación (?) para evitar Inyecciones SQL (Otro punto de seguridad)
        const sql = 'INSERT INTO Usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)';

        // 4. Mandamos los datos limpios a tu base de datos UGestión
        db.query(sql, [nombre, correo, passwordHash, rol], (err, result) => {
            if (err) {
                console.error('❌ Error al registrar usuario:', err.message);
                return res.status(500).json({ mensaje: 'Error al guardar el usuario. ¿Quizás el correo ya existe?' });
            }
            
            // ¡Éxito!
            res.status(201).json({ mensaje: '¡Usuario registrado con éxito y contraseña encriptada!' });
        });
    } catch (error) {
        console.error('❌ Error en el proceso de encriptación:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al procesar la seguridad.' });
    }
});

// 👇 ¡NUEVO 2: AQUÍ ESTÁ LA RUTA DE LOGIN! 👇
app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;

    // Buscamos al usuario por su correo
    const sql = 'SELECT * FROM Usuarios WHERE correo = ?';
    
    db.query(sql, [correo], async (err, results) => {
        if (err) {
            return res.status(500).json({ mensaje: 'Error interno del servidor' });
        }

        // Si no hay resultados, el correo no existe
        if (results.length === 0) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        const usuario = results[0];

        // Comparamos la contraseña escrita con el Hash de la base de datos
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }

        // Creamos el "Pase VIP" (Token JWT) guardando el id y el rol
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            'LLAVE_SECRETA_UGESTION_123', 
            { expiresIn: '2h' } // Caduca en 2 horas
        );

        res.status(200).json({ 
            mensaje: `¡Bienvenido, ${usuario.nombre}!`,
            token: token,
            rol: usuario.rol
        });
    });
});
// 👆 FIN DE LA RUTA DE LOGIN 👆

// Encendemos el servidor
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto http://localhost:${port}`);
});