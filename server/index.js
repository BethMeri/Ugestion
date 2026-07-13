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
  host: "mysql-ugestion.alwaysdata.net",
  user: "ugestion",
  password: "JDBMGestion",
  database: "ugestion_bd",
  port: 3306
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
      // 1. Atrapamos cualquier error interno de la base de datos (¡Este es el que necesitamos ver!)
      if (err) {
        console.error("🚨 ERROR REAL DE SQL:", err);
        return res.status(500).json({ 
          mensaje: "Error interno de SQL", 
          detalle: err.message 
        });
      }
      
      // 2. Si no hay error en BD, pero el correo no existe en la tabla
      if (results.length === 0) {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }

      // 3. Validamos la contraseña encriptada
      const usuario = results[0];
      if (await bcrypt.compare(password, usuario.password_hash)) {
        const token = jwt.sign(
          { id: usuario.id, rol: usuario.rol },
          "LLAVE_SECRETA_UGESTION_123",
          { expiresIn: "4h" }
        );
        return res.status(200).json({ token, rol: usuario.rol });
      } else {
        return res.status(401).json({ mensaje: "Credenciales incorrectas" });
      }
    }
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

        // Buscamos el nombre del usuario para el log
        db.query(
          "SELECT nombre FROM usuarios WHERE id = ?",
          [req.usuario.id],
          (errU, resU) => {
            const nombre =
              !errU && resU.length > 0 ? resU[0].nombre : "Un usuario";
            const mensaje = `${nombre} creó la actividad "${titulo}"`;

            db.query(
              "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
              [req.usuario.id, mensaje],
            );
          },
        );

        res.status(201).json({ mensaje: "¡Tarea publicada!" });
      },
    );
  },
);
// ==========================================
// ✏️ RUTA PARA EDITAR TAREAS
// ==========================================
app.put(
  "/api/tareas/:id",
  verificarToken,
  verificarRol(["Docente", "Admin"]),
  (req, res) => {
    const { titulo, descripcion } = req.body;
    const { id } = req.params;

    const sql = "UPDATE Tareas SET titulo = ?, descripcion = ? WHERE id = ?";

    db.query(sql, [titulo, descripcion, id], (err, result) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al actualizar en BD" });

      // Buscamos el nombre del usuario para el log
      db.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [req.usuario.id],
        (errU, resU) => {
          const nombre =
            !errU && resU.length > 0 ? resU[0].nombre : "Un usuario";
          const mensaje = `${nombre} editó la actividad "${titulo}"`;

          db.query(
            "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
            [req.usuario.id, mensaje],
          );
        },
      );

      res.json({ mensaje: "¡Tarea editada con éxito!" });
    });
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
    const { id } = req.params; // ID de la tarea
    const estudianteId = req.usuario.id;

    // 1. Guardar la entrega
    const sqlEntrega =
      'INSERT INTO Entregas (tarea_id, estudiante_id, url_archivo, estado) VALUES (?, ?, ?, "Entregado")';

    db.query(sqlEntrega, [id, estudianteId, estado], (err, result) => {
      if (err) {
        console.error("❌ ERROR AL GUARDAR ENTREGA:", err);
        return res.status(500).json({ mensaje: err.message });
      }

      // 2. BUSCAR NOMBRE DEL ESTUDIANTE Y TÍTULO DE LA TAREA
      db.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [estudianteId],
        (errU, resU) => {
          db.query(
            "SELECT titulo FROM Tareas WHERE id = ?",
            [id],
            (errT, resT) => {
              const nombre =
                !errU && resU.length > 0
                  ? resU[0].nombre
                  : `Estudiante #${estudianteId}`;
              const titulo =
                !errT && resT.length > 0 ? resT[0].titulo : `Tarea #${id}`;

              // Mensaje con el título real de la tarea
              const mensaje = `${nombre} entregó el documento de la actividad "${titulo}"`;

              db.query(
                "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
                [estudianteId, mensaje],
                (errLog) => {
                  if (errLog) console.error("❌ ERROR AL GUARDAR LOG:", errLog);
                },
              );
            },
          );
        },
      );

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
    // Asegúrate de que esta consulta sea SELECT *
    const sql =
      "SELECT * FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?";

    db.query(sql, [req.params.id, req.usuario.id], (err, results) => {
      if (err)
        return res.status(500).json({ mensaje: "Error al obtener entrega" });

      // Si hay resultados, devuelve el objeto completo tal cual está en la BD
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

    // 1. Primero eliminamos la entrega
    const sql = "DELETE FROM Entregas WHERE tarea_id = ? AND estudiante_id = ?";
    db.query(sql, [id_tarea, estudiante_id], (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error al eliminar." });

      // 2. Buscamos el nombre del estudiante Y el título de la tarea
      // Usamos una consulta un poco más inteligente
      db.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [estudiante_id],
        (errU, resU) => {
          db.query(
            "SELECT titulo FROM Tareas WHERE id = ?",
            [id_tarea],
            (errT, resT) => {
              const nombre =
                !errU && resU.length > 0
                  ? resU[0].nombre
                  : `Estudiante #${estudiante_id}`;
              const titulo =
                !errT && resT.length > 0
                  ? resT[0].titulo
                  : `Tarea #${id_tarea}`;

              // 3. Creamos el mensaje con el nombre y el título
              const mensaje = `${nombre} anuló su entrega de la actividad "${titulo}"`;

              // 4. Guardamos en auditoría
              db.query(
                "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
                [estudiante_id, mensaje],
              );
            },
          );
        },
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

app.put(
  "/api/entregas/:id/calificar",
  verificarToken,
  verificarRol(["Docente"]),
  (req, res) => {
    const { calificacion } = req.body;
    const entregaId = req.params.id;

    if (calificacion < 0 || calificacion > 10) {
      return res
        .status(400)
        .json({ mensaje: "La calificación debe estar entre 0 y 10" });
    }

    // 1. Actualizamos la calificación
    const sql =
      "UPDATE Entregas SET calificacion = ?, estado = 'Calificado' WHERE id = ?";

    db.query(sql, [calificacion, entregaId], (err, result) => {
      if (err) return res.status(500).json({ mensaje: "Error al calificar" });

      // 2. BUSCAR DATOS PARA AUDITORÍA
      // Necesitamos: Nombre docente, Título tarea, y Nombre estudiante

      // Consultamos el nombre del docente (que está en req.usuario.id)
      db.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [req.usuario.id],
        (errDoc, resDoc) => {
          // Consultamos la info de la entrega: título tarea y nombre estudiante
          const sqlInfo = `
            SELECT t.titulo, u.nombre AS nombre_estudiante 
            FROM Entregas e 
            JOIN Tareas t ON e.tarea_id = t.id 
            JOIN usuarios u ON e.estudiante_id = u.id 
            WHERE e.id = ?`;

          db.query(sqlInfo, [entregaId], (errInfo, resInfo) => {
            const nombreDocente =
              !errDoc && resDoc.length > 0 ? resDoc[0].nombre : "Un docente";
            const info =
              !errInfo && resInfo.length > 0
                ? resInfo[0]
                : { titulo: "una tarea", nombre_estudiante: "un estudiante" };

            // 3. MENSAJE LEGIBLE Y DETALLADO
            const mensaje = `${nombreDocente} calificó a ${info.nombre_estudiante} con (${calificacion}/10) la actividad "${info.titulo}"`;

            db.query(
              "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
              [req.usuario.id, mensaje],
            );
          });
        },
      );

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
    const usuario_id = req.usuario.id;

    // 1. Buscamos el título de la tarea Y el nombre del usuario antes de borrar
    db.query(
      "SELECT titulo FROM Tareas WHERE id = ?",
      [id_tarea],
      (errT, resT) => {
        db.query(
          "SELECT nombre FROM usuarios WHERE id = ?",
          [usuario_id],
          (errU, resU) => {
            const titulo =
              !errT && resT.length > 0 ? resT[0].titulo : `ID: ${id_tarea}`;
            const nombre =
              !errU && resU.length > 0 ? resU[0].nombre : "Un usuario";
            const mensaje = `${nombre} eliminó la actividad "${titulo}"`;

            // 2. Ahora sí borramos la tarea
            db.query(
              "DELETE FROM Tareas WHERE id = ?",
              [id_tarea],
              (err, result) => {
                if (err)
                  return res
                    .status(500)
                    .json({ mensaje: "Error al eliminar la tarea." });
                if (result.affectedRows === 0)
                  return res
                    .status(404)
                    .json({ mensaje: "Tarea no encontrada." });

                // 3. Registramos en auditoría con el título ya guardado
                db.query(
                  "INSERT INTO auditoria_logs (usuario_id, accion) VALUES (?, ?)",
                  [usuario_id, mensaje],
                );

                res.json({ mensaje: "¡Tarea eliminada exitosamente!" });
              },
            );
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
