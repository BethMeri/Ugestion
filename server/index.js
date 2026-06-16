const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const { verificarToken, verificarRol } = require('./middlewares/auth'); 
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
            { expiresIn: '4h' } // Caduca en 4 horas
        );

        res.status(200).json({ 
            mensaje: `¡Bienvenido, ${usuario.nombre}!`,
            token: token,
            rol: usuario.rol
        });
    });
});
// 👆 FIN DE LA RUTA DE LOGIN 👆

// Ruta secreta SÓLO para el Admin
app.get('/api/panel-admin', verificarToken, verificarRol(['Admin']), (req, res) => {
    res.json({ mensaje: '¡Bienvenida al Panel de Control Supremo' });
});

// Ruta para Docentes y Admin (El estudiante no puede entrar aquí)
app.get('/api/calificaciones', verificarToken, verificarRol(['Admin', 'Docente']), (req, res) => {
    res.json({ mensaje: 'Aquí se suben y gestionan las notas de los alumnos. 📝' });
});

// ==========================================
// 📝 RUTAS DE TAREAS (CRUD) Y AUDITORÍA
// ==========================================

// 1. CREAR TAREA (Solo Docentes y Admin)
app.post('/api/tareas', verificarToken, verificarRol(['Docente', 'Admin']), (req, res) => {
    // Tu frontend mandará esto
    const { titulo, descripcion } = req.body;
    
    // ¡Nuestro Guardia de Seguridad ya nos guardó el ID de quien hizo la petición!
    const docente_id = req.usuario.id; 

    // Paso A: Guardar la tarea
    const sqlTarea = 'INSERT INTO Tareas (titulo, descripcion, docente_id) VALUES (?, ?, ?)';
    
    db.query(sqlTarea, [titulo, descripcion, docente_id], (err, result) => {
        if (err) {
            console.error('❌ Error al crear tarea:', err.message);
            return res.status(500).json({ mensaje: 'Error al guardar la tarea en la base de datos.' });
        }

        // Paso B: ¡LA AUDITORÍA SILENCIOSA! 🕵️‍♀️
        // result.insertId nos da el ID exacto de la tarea que se acaba de crear
        const id_nueva_tarea = result.insertId;
        const accion = `Creó una nueva tarea ID #${id_nueva_tarea} titulada: "${titulo}"`;
        const sqlAuditoria = 'INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)';

        db.query(sqlAuditoria, [docente_id, accion], (errAudit) => {
            if (errAudit) {
                console.error('❌ Error guardando el log de auditoría:', errAudit.message);
                // Ojo: Si la auditoría falla, igual le decimos al usuario que su tarea se creó,
                // para no interrumpir su trabajo, pero a nosotros nos queda el error en la terminal.
            }
        });

        res.status(201).json({ mensaje: '¡Tarea publicada exitosamente y registrada en auditoría!' });
    });
});

// 2. VER TODAS LAS TAREAS (Cualquiera con Pase VIP)
app.get('/api/tareas', verificarToken, (req, res) => {
    const sql = 'SELECT * FROM Tareas';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ mensaje: 'Error al obtener el listado de tareas.' });
        }
        res.json(results);
    });
});

// 3. ACTUALIZAR TAREA (Solo Docentes y Admin)
app.put('/api/tareas/:id', verificarToken, verificarRol(['Docente', 'Admin']), (req, res) => {
    // Tomamos el ID de la tarea desde la URL (ej: /api/tareas/5)
    const id_tarea = req.params.id; 
    const { titulo, descripcion } = req.body;
    const usuario_id = req.usuario.id;

    const sqlUpdate = 'UPDATE Tareas SET titulo = ?, descripcion = ? WHERE id = ?';
    
    db.query(sqlUpdate, [titulo, descripcion, id_tarea], (err, result) => {
        if (err) {
            console.error('❌ Error al actualizar:', err.message);
            return res.status(500).json({ mensaje: 'Error al actualizar la tarea.' });
        }

        // Si affectedRows es 0, significa que no existe ninguna tarea con ese ID
        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró la tarea para actualizar.' });
        }

        // 🕵️‍♀️ LA AUDITORÍA SILENCIOSA
        const accion = `Actualizó la tarea ID #${id_tarea} modificando su título a: "${titulo}"`;
        const sqlAuditoria = 'INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)';
        db.query(sqlAuditoria, [usuario_id, accion]);

        res.json({ mensaje: '¡Tarea actualizada correctamente y registrada en auditoría!' });
    });
});

// 4. ELIMINAR TAREA (Solo Docentes y Admin)
app.delete('/api/tareas/:id', verificarToken, verificarRol(['Docente', 'Admin']), (req, res) => {
    const id_tarea = req.params.id;
    const usuario_id = req.usuario.id;

    const sqlDelete = 'DELETE FROM Tareas WHERE id = ?';
    
    db.query(sqlDelete, [id_tarea], (err, result) => {
        if (err) {
            console.error('❌ Error al eliminar:', err.message);
            return res.status(500).json({ mensaje: 'Error al eliminar la tarea.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se encontró la tarea para eliminar.' });
        }

        // 🕵️‍♀️ LA AUDITORÍA SILENCIOSA
        const accion = `Eliminó permanentemente la tarea ID #${id_tarea}`;
        const sqlAuditoria = 'INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)';
        db.query(sqlAuditoria, [usuario_id, accion]);

        res.json({ mensaje: '¡Tarea eliminada exitosamente y registrada en auditoría!' });
    });
});

app.get('/api/auditoria', verificarToken, verificarRol(['Admin']), (req, res) => {
    // Hemos ajustado la consulta para que coincida con el nombre real 'fecha_hora'
    const sql = 'SELECT accion, fecha_hora FROM auditoria_logs ORDER BY fecha_hora DESC';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ ERROR REAL DE MYSQL:', err);
            return res.status(500).json({ mensaje: 'Error al obtener logs' });
        }
        res.json(results);
    });
});

// Ruta para obtener el detalle de UNA tarea específica
app.get('/api/tareas/:id', verificarToken, (req, res) => {
    const id_tarea = req.params.id;
    const sql = 'SELECT * FROM Tareas WHERE id = ?';
    
    db.query(sql, [id_tarea], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener la tarea' });
        if (results.length === 0) return res.status(404).json({ mensaje: 'Tarea no encontrada' });
        
        res.json(results[0]); // Enviamos solo la tarea encontrada
    });
});

// Y al final, el servidor:
app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en el puerto http://localhost:${port}`);
});


