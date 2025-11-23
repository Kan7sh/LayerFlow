import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const MODEL_BASE_URL = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/';
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'models');
const RESOURCES_DIR = path.join(PUBLIC_DIR, 'resources');

interface FileToDownload {
  url: string;
  path: string;
}

const FILES_TO_DOWNLOAD: FileToDownload[] = [
  { url: 'resources/isnet.onnx', path: 'resources/isnet.onnx' },
  { url: 'resources/isnet_fp16.onnx', path: 'resources/isnet_fp16.onnx' },
  { url: 'resources/isnet_quint8.onnx', path: 'resources/isnet_quint8.onnx' },
  { url: 'resources.json', path: 'resources.json' },
];

// Create directories if they don't exist
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

if (!fs.existsSync(RESOURCES_DIR)) {
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
}

function downloadFile(url: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(destination)}`);
        resolve();
      });
    }).on('error', (err: Error) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
}

async function downloadAllModels(): Promise<void> {
  console.log('📦 Downloading background removal models...');
  
  for (const file of FILES_TO_DOWNLOAD) {
    const url = MODEL_BASE_URL + file.url;
    const destination = path.join(PUBLIC_DIR, file.path);
    
    try {
      await downloadFile(url, destination);
    } catch (error) {
      const err = error as Error;
      console.error(`❌ Failed to download ${file.url}:`, err.message);
    }
  }
  
  console.log('🎉 All models downloaded!');
  console.log('\nExpected folder structure:');
  console.log('public/');
  console.log('└── models/');
  console.log('    ├── resources.json');
  console.log('    └── resources/');
  console.log('        ├── isnet.onnx');
  console.log('        ├── isnet_fp16.onnx');
  console.log('        └── isnet_quint8.onnx');
}

downloadAllModels();