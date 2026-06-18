const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verificarToken, verificarRol } = require("./middlewares/auth");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ugestion_seguridad",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
    return;
  }
  console.log("✅ Conexión exitosa a la base de datos UGestión");
});

// ==========================================
// 🔐 AUTENTICACIÓN Y REGISTRO
// ==========================================
app.post("/api/registro", async (req, res) => {
  const { nombre, correo, password, rol } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO Usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)",
      [nombre, correo, passwordHash, rol],
      (err) => {
        if (err)
          return res.status(500).json({ mensaje: "Error al registrar." });
        res.status(201).json({ mensaje: "¡Usuario registrado con éxito!" });
      },
    );
  } catch (error) {
    res.status(500).json({ mensaje: "Error interno." });
  }
});

app.post("/api/login", (req, res) => {
  const { correo, password } = req.body;
  db.query(
    "SELECT * FROM Usuarios WHERE correo = ?",
    [correo],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      const usuario = results[0];
      if (await bcrypt.compare(password, usuario.password_hash)) {
        const token = jwt.sign(
          { id: usuario.id, rol: usuario.rol },
          "LLAVE_SECRETA_UGESTION_123",
          { expiresIn: "4h" },
        );
        res.status(200).json({ token, rol: usuario.rol });
      } else {
        res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }
    },
  );
});

// ==========================================
// 📝 GESTIÓN DE TAREAS
// ==========================================
app.get("/api/tareas", verificarToken, (req, res) => {
  db.query("SELECT * FROM Tareas", (err, results) => {
    if (err)
      return res.status(500).json({ mensaje: "Error al obtener tareas." });
    res.json(results);
  });
});

app.get("/api/tareas/:id", verificarToken, (req, res) => {
  db.query(
    "SELECT * FROM Tareas WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ mensaje: "No encontrada" });
      res.json(results[0]);
    },
  );
});

app.post(
  "/api/tareas",
  verificarToken,
  verificarRol(["Docente", "Admin"]),
  (req, res) => {
    const { titulo, descripcion } = req.body;
    db.query(
      "INSERT INTO Tareas (titulo, descripcion, docente_id) VALUES (?, ?, ?)",
      [titulo, descripcion, req.usuario.id],
      (err, result) => {
        if (err) return res.status(500).json({ mensaje: "Error al guardar." });
        db.query(
          "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
          [req.usuario.id, `Creó tarea: "${titulo}"`],
        );
        res.status(201).json({ mensaje: "¡Tarea publicada!" });
      },
    );
  },
);

// ==========================================
// 🎓 CONTROL DE ENTREGAS
// ==========================================

// Estudiante: Enviar
app.post(
  "/api/tareas/:id/entregas",
  verificarToken,
  verificarRol(["Estudiante"]),
  (req, res) => {
    const { estado } = req.body;
    const sql =
      'INSERT INTO Entregas (tarea_id, estudiante_id, url_archivo, estado) VALUES (?, ?, ?, "Entregado")';

    db.query(sql, [req.params.id, req.usuario.id, estado], (err, result) => {
      if (err) {
        console.error("❌ ERROR SQL DETALLADO:", err); // ¡Esto nos dirá la verdad!
        return res.status(500).json({ mensaje: err.message }); // Enviamos el error al front
      }
      res.status(201).json({ mensaje: "Éxito" });
    });
  },
);

// Estudiante: Ver su propia entrega
app.get(
  "/api/tareas/:id/mi-entrega",
  verificarToken,
  verificarRol(["Estudiante"]),
  (req, res) => {
    const sql =
      "SELECT * FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?";
    db.query(sql, [req.params.id, req.usuario.id], (err, results) => {
      if (err) return res.status(500).json({ mensaje: "Error" });
      res.json(results.length > 0 ? results[0] : null);
    });
  },
);

// Estudiante: Eliminar entrega (Anular envío)
app.delete(
  "/api/tareas/:id/entregas",
  verificarToken,
  verificarRol(["Estudiante"]),
  (req, res) => {
    const id_tarea = req.params.id;
    const estudiante_id = req.usuario.id;

    // Asegúrate de que el nombre de la tabla sea exactamente igual al de tu BD
    const sql = "DELETE FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?";

    db.query(sql, [id_tarea, estudiante_id], (err, result) => {
      if (err) {
        console.error("❌ ERROR AL ELIMINAR:", err);
        return res
          .status(500)
          .json({ mensaje: "Error al eliminar la entrega." });
      }

      // Log de auditoría
      db.query(
        "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
        [
          estudiante_id,
          `El estudiante anuló su entrega de la tarea #${id_tarea}`,
        ],
      );

      res.json({ mensaje: "Entrega eliminada correctamente." });
    });
  },
);

// Docente: Ver entregas de todos (OJO: aquí mapeamos url_archivo a 'estado' para que el frontend no falle)
app.get(
  "/api/tareas/:id/entregas",
  verificarToken,
  verificarRol(["Docente"]),
  (req, res) => {
    const sql = `SELECT e.id, u.nombre AS nombre_estudiante, e.url_archivo AS estado, e.calificacion 
                 FROM Entregas e JOIN Usuarios u ON e.estudiante_id = u.id WHERE e.tarea_id = ?`;
    db.query(sql, [req.params.id], (err, results) => {
      if (err) return res.status(500).json({ mensaje: "Error" });
      res.json(results);
    });
  },
);

// Docente: Calificar
app.put(
  "/api/entregas/:id/calificar",
  verificarToken,
  verificarRol(["Docente"]),
  (req, res) => {
    // Agregamos el cambio de estado a 'Calificado' aquí
    const sql =
      "UPDATE Entregas SET calificacion = ?, estado = 'Calificado' WHERE id = ?";

    db.query(sql, [req.body.calificacion, req.params.id], (err) => {
      if (err) return res.status(500).json({ mensaje: "Error al calificar" });
      res.json({ mensaje: "Calificado" });
    });
  },
);

// ==========================================
// 📝 RUTA FALTANTE PARA ELIMINAR TAREAS
// ==========================================
app.delete(
  "/api/tareas/:id",
  verificarToken,
  verificarRol(["Docente", "Admin"]),
  (req, res) => {
    const id_tarea = req.params.id;

    // 1. Primero registramos en auditoría (antes de borrar)
    db.query(
      "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
      [req.usuario.id, `Eliminó la tarea ID #${id_tarea}`],
      (err) => {
        if (err) console.error("Error en auditoría:", err);

        // 2. Luego borramos la tarea
        db.query(
          "DELETE FROM Tareas WHERE id = ?",
          [id_tarea],
          (err, result) => {
            if (err)
              return res
                .status(500)
                .json({ mensaje: "Error al eliminar la tarea." });

            if (result.affectedRows === 0) {
              return res.status(404).json({ mensaje: "Tarea no encontrada." });
            }

            res.json({ mensaje: "¡Tarea eliminada exitosamente!" });
          },
        );
      },
    );
  },
);

// Auditoría
app.get(
  "/api/auditoria",
  verificarToken,
  verificarRol(["Admin"]),
  (req, res) => {
    db.query(
      "SELECT * FROM auditoria_logs ORDER BY fecha_hora DESC",
      (err, results) => {
        if (err) return res.status(500).json({ mensaje: "Error" });
        res.json(results);
      },
    );
  },
);

app.get("/", (req, res) => {
  res.send("¡El servidor de UGestión está operativo y seguro! 🚀");
});

app.listen(port, () => console.log(`🚀 Servidor en puerto ${port}`));
