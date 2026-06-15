const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Démarrage de la base de données et de Redis...');
try {
  execSync('docker-compose up -d db redis', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️ Erreur Docker, ou Docker est déjà lancé.');
}

console.log('🔄 Préparation de la base de données (Prisma)...');
try {
  execSync('npx prisma db push', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  execSync('npm run db:seed', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
} catch (e) {
  console.error('❌ Erreur lors de la migration ou du seed de la base de données');
}

console.log('🚀 Démarrage du Backend sur le port 4000...');
const backend = spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, 'backend'), shell: true });

console.log('🌍 Création du tunnel public pour le Backend...');
const ltBackend = spawn('npx', ['localtunnel', '--port', '4000'], { shell: true });

ltBackend.stdout.on('data', (data) => {
  const str = data.toString();
  if (str.includes('your url is:')) {
    const backendUrl = str.split('your url is:')[1].trim();
    console.log('✅ URL Backend générée:', backendUrl);
    
    // Configurer le frontend avec cette URL
    const envContent = `NEXT_PUBLIC_API_URL=${backendUrl}/api/v1\n`;
    fs.writeFileSync(path.join(__dirname, 'frontend', '.env.local'), envContent);
    console.log('✅ Fichier .env.local mis à jour avec la nouvelle URL API.');
    
    // Démarrer le frontend
    console.log('🏗️ Compilation du Frontend...');
    execSync('npm run build', { cwd: path.join(__dirname, 'frontend'), stdio: 'inherit' });
    
    console.log('💻 Démarrage du Frontend sur le port 3000...');
    const frontend = spawn('npm', ['start'], { cwd: path.join(__dirname, 'frontend'), shell: true });
    
    console.log('🌍 Création du tunnel public pour le Frontend...');
    const ltFrontend = spawn('npx', ['localtunnel', '--port', '3000'], { shell: true });
    
    ltFrontend.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes('your url is:')) {
        const frontendUrl = s.split('your url is:')[1].trim();
        console.log('\n================================================================');
        console.log('🎉 APPLICATION DISPONIBLE EN LIGNE (OUVREZ SUR VOTRE MOBILE) :');
        console.log('👉 ' + frontendUrl);
        console.log('================================================================\n');
      }
    });
  }
});
