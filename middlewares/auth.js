const jwt = require('jsonwebtoken');

// Escudo 1: Verificar que el usuario tenga su Token (El Pase VIP)
const verificarToken = (req, res, next) => {
    // Buscamos el token en la cabecera de la petición
    const token = req.header('Authorization');

    // Si no trae token, le cerramos la puerta en la cara
    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No tienes tu Pase VIP.' });
    }

    try {
        // A veces el frontend manda el token con la palabra "Bearer " al inicio, se la quitamos por si acaso
        const tokenLimpio = token.replace('Bearer ', '');
        
        // Comprobamos que el token sea auténtico con nuestra llave secreta
        const verificado = jwt.verify(tokenLimpio, 'LLAVE_SECRETA_UGESTION_123');
        
        // Guardamos los datos del usuario (id y rol) para que las siguientes rutas sepan quién es
        req.usuario = verificado; 
        
        next(); // Todo en orden, ¡adelante!
    } catch (error) {
        res.status(400).json({ mensaje: 'Token falso, inválido o caducado.' });
    }
};

// Escudo 2: Control de Acceso Basado en Roles (El famoso RBAC)
const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        // Revisamos si el rol del usuario está en la lista VIP de la ruta a la que intenta entrar
        if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ 
                mensaje: `Acceso prohibido. Requiere nivel: ${rolesPermitidos.join(' o ')}.` 
            });
        }
        next(); // Tiene el rol correcto, puede pasar
    };
};

module.exports = { verificarToken, verificarRol };