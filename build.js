const fs = require('fs');
const { execSync } = require('child_process');

try {
    const commitCount = execSync('git rev-list --count HEAD').toString().trim();
    const packageJsonPath = 'package.json';
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const versionParts = pkg.version.split('.');
    versionParts[2] = commitCount;
    const newVersion = versionParts.join('.');
    
    pkg.version = newVersion;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Version updated to ${newVersion} based on commit count.`);
    
    console.log('Running vsce package...');
    execSync('npx vsce package', { stdio: 'inherit' });
    
    console.log('Build successful!');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
