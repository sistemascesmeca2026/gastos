// Uso: node scripts/crear_usuario.js <username> <password> "<Nombre Completo>"
// Genera el INSERT SQL listo para pegar y ejecutar contra la base de datos.

const bcrypt = require('bcryptjs');

const [, , username, password, nombre] = process.argv;

if (!username || !password || !nombre) {
  console.error('Uso: node scripts/crear_usuario.js <username> <password> "<Nombre Completo>"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  const sql = `INSERT INTO usuarios (username, password_hash, nombre) VALUES ('${username}', '${hash}', '${nombre.replace(/'/g, "''")}');`;
  console.log('\nEjecuta este SQL contra la base de datos:\n');
  console.log(sql);
  console.log('');
});
