const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const { verificarToken, verificarRol } = require('./middlewares/auth'); 

const app = express();
const port = 3000;

// Middlewares globales de seguridad
app.use(cors()); 
app.use(express.json()); 

// Conexión oficial a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '', 
    database: 'ugestion_seguridad' 
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('✅ Conexión exitosa a la base de datos UGestión');
});

app.get('/', (req, res) => {
    res.send('¡El servidor de UGestión está vivo y seguro! 🚀🔒');
});

// ==========================================
// 🔐 AUTENTICACIÓN Y REGISTRO
// ==========================================

app.post('/api/registro', async (req, res) => {
    const { nombre, correo, password, rol } = req.body;
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO Usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)';

        db.query(sql, [nombre, correo, passwordHash, rol], (err, result) => {
            if (err) {
                console.error('❌ Error al registrar:', err.message);
                return res.status(500).json({ mensaje: 'Error al guardar el usuario.' });
            }
            res.status(201).json({ mensaje: '¡Usuario registrado con éxito!' });
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
});

app.post('/api/login', (req, res) => {
    const { correo, password } = req.body;
    const sql = 'SELECT * FROM Usuarios WHERE correo = ?';
    
    db.query(sql, [correo], async (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error interno del servidor' });
        if (results.length === 0) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });

        const usuario = results[0];
        const passwordValida = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordValida) return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            'LLAVE_SECRETA_UGESTION_123', 
            { expiresIn: '4h' } 
        );

        res.status(200).json({ 
            mensaje: `¡Bienvenido, ${usuario.nombre}!`,
            token: token,
            rol: usuario.rol
        });
    });
});

// ==========================================
// 📝 GESTIÓN DE TAREAS (CRUD)
// ==========================================

app.post('/api/tareas', verificarToken, verificarRol(['Docente', 'Admin']), (req, res) => {
    const { titulo, descripcion } = req.body;
    const docente_id = req.usuario.id; 

    const sqlTarea = 'INSERT INTO Tareas (titulo, descripcion, docente_id) VALUES (?, ?, ?)';
    
    db.query(sqlTarea, [titulo, descripcion, docente_id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al guardar la tarea.' });

        const id_nueva_tarea = result.insertId;
        const accion = `Creó una nueva tarea ID #${id_nueva_tarea} titulada: "${titulo}"`;
        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', [docente_id, accion]);
        
        res.status(201).json({ mensaje: '¡Tarea publicada exitosamente!' });
    });
});

app.get('/api/tareas', verificarToken, (req, res) => {
    db.query('SELECT * FROM Tareas', (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al obtener tareas.' });
        res.json(results);
    });
});

app.put('/api/tareas/:id', verificarToken, verificarRol(['Docente']), (req, res) => {
    const id_tarea = req.params.id; 
    const { titulo, descripcion } = req.body;

    const sqlUpdate = 'UPDATE Tareas SET titulo = ?, descripcion = ? WHERE id = ?';
    db.query(sqlUpdate, [titulo, descripcion, id_tarea], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al actualizar.' });
        
        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', 
            [req.usuario.id, `Actualizó la tarea académica ID #${id_tarea} a: "${titulo}"`]);

        res.json({ mensaje: '¡Tarea actualizada correctamente!' });
    });
});

app.delete('/api/tareas/:id', verificarToken, verificarRol(['Docente']), (req, res) => {
    const id_tarea = req.params.id;
    db.query('DELETE FROM Tareas WHERE id = ?', [id_tarea], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al eliminar.' });
        
        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', 
            [req.usuario.id, `Eliminó permanentemente la tarea ID #${id_tarea}`]);

        res.json({ mensaje: '¡Tarea eliminada exitosamente!' });
    });
});

app.get('/api/tareas/:id', verificarToken, (req, res) => {
    db.query('SELECT * FROM Tareas WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error' });
        if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrada' });
        res.json(results[0]); 
    });
});

// ==========================================
// 🎓 CONTROL DE ENTREGAS Y CALIFICACIONES
// ==========================================

// Estudiante: Registrar entrega de documento
app.post('/api/tareas/:id/entregas', verificarToken, verificarRol(['Estudiante']), (req, res) => {
    const id_tarea = req.params.id;
    const estudiante_id = req.usuario.id; 
    const { estado } = req.body; 

    const sql = 'INSERT INTO Entregas (tarea_id, estudiante_id, estado, calificacion) VALUES (?, ?, ?, NULL)';
    db.query(sql, [id_tarea, estudiante_id, estado], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al registrar entrega.' });

        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', 
            [estudiante_id, `El estudiante entregó el documento de la tarea #${id_tarea}`]);

        res.status(201).json({ mensaje: '¡Entrega registrada!' });
    });
});

// Estudiante: Consultar estado de su propia entrega (¡LA RUTA QUE RESOLVERÁ TU PROBLEMA!)
app.get('/api/tareas/:id/mi-entrega', verificarToken, verificarRol(['Estudiante']), (req, res) => {
    const id_tarea = req.params.id;
    const estudiante_id = req.usuario.id;

    const sql = 'SELECT * FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?';
    db.query(sql, [id_tarea, estudiante_id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al consultar entrega propia.' });
        if (results.length === 0) return res.json(null); 
        res.json(results[0]); 
    });
});

// Estudiante: Eliminar entrega (Anular envío)
app.delete('/api/tareas/:id/entregas', verificarToken, verificarRol(['Estudiante']), (req, res) => {
    const id_tarea = req.params.id;
    const estudiante_id = req.usuario.id;

    const sql = 'DELETE FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?';
    db.query(sql, [id_tarea, estudiante_id], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al eliminar la entrega.' });

        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', 
            [estudiante_id, `El estudiante anuló/eliminó su entrega de la tarea #${id_tarea}`]);

        res.json({ mensaje: 'Entrega eliminada correctamente.' });
    });
});

// Docente: Listar todas las entregas asociadas a una tarea
app.get('/api/tareas/:id/entregas', verificarToken, verificarRol(['Docente']), (req, res) => {
    const sql = `
        SELECT e.id, u.nombre AS nombre_estudiante, e.estado, e.calificacion, e.fecha_entrega 
        FROM Entregas e
        JOIN Usuarios u ON e.estudiante_id = u.id
        WHERE e.tarea_id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error al cargar entregas.' });
        res.json(results);
    });
});

// Docente: Asentar o editar calificación de una entrega específica
app.put('/api/entregas/:id/calificar', verificarToken, verificarRol(['Docente']), (req, res) => {
    const id_entrega = req.params.id;
    const { calificacion } = req.body;

    const sqlUpdate = 'UPDATE Entregas SET calificacion = ? WHERE id = ?';
    db.query(sqlUpdate, [calificacion, id_entrega], (err, result) => {
        if (err) return res.status(500).json({ mensaje: 'Error al guardar la calificación.' });

        db.query('INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)', 
            [req.usuario.id, `Asentó la calificación de (${calificacion}/10) en la entrega ID #${id_entrega}`]);

        res.json({ mensaje: 'Calificación registrada.' });
    });
});

// ==========================================
// 🕵️‍♀️ AUDITORÍA (SÓLO ADMIN)
// ==========================================
app.get('/api/auditoria', verificarToken, verificarRol(['Admin']), (req, res) => {
    const sql = 'SELECT accion, fecha_hora FROM auditoria_logs ORDER BY fecha_hora DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error en logs' });
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`🚀 Servidor de UGestión corriendo de forma segura en puerto ${port}`);
});