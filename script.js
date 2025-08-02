import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 0, 1).normalize();
scene.add(light);

let helmet;
const loader = new GLTFLoader();
loader.load('helmet.glb', gltf => {
  helmet = gltf.scene;
  helmet.scale.set(1, 1, 1);
  scene.add(helmet);
}, undefined, error => {
  console.error('Erro ao carregar o modelo:', error);
});

function onResults(results) {
  if (!helmet || !results.multiFaceLandmarks) return;

  const landmarks = results.multiFaceLandmarks[0];
  const nose = landmarks[1]; // ponto central aproximado

  // Atualiza a posição do capacete baseado no nariz
  helmet.position.set(
    (nose.x - 0.5) * 2,
    -(nose.y - 0.5) * 2,
    -1
  );

  renderer.render(scene, camera);
}

const faceMesh = new FaceMesh({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
faceMesh.onResults(onResults);

const mpCamera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 640,
  height: 480
});
mpCamera.start();
