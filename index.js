// AIRI Hero Globe - standalone script
// Host this file and load via <script type="module" src="URL"></script>
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

(function(){
  const canvas = document.getElementById('heroGlobe');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 2.6;
  const globe = new THREE.Group();
  scene.add(globe);

  const solidMat = new THREE.MeshBasicMaterial({color:0x2a2a2a});
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.998,64,64), solidMat));

  const texSize = 4096;
  const texCanvas = document.createElement('canvas');
  texCanvas.width = texSize; texCanvas.height = texSize/2;
  const tc = texCanvas.getContext('2d');
  tc.fillStyle = 'rgba(255,255,255,0.18)';
  tc.fillRect(0, 0, texSize, texSize/2);
  tc.strokeStyle = 'rgba(255,255,255,0.3)'; tc.lineWidth = 3;
  for (let lat=-75; lat<=75; lat+=15) {
    if (lat===0) continue;
    const y = (90-lat)/180*(texSize/2);
    tc.beginPath(); tc.moveTo(0,y); tc.lineTo(texSize,y); tc.stroke();
  }
  for (let lng=-180; lng<180; lng+=15) {
    const x = (lng+180)/360*texSize;
    tc.beginPath(); tc.moveTo(x,0); tc.lineTo(x,texSize/2); tc.stroke();
  }

  const earthTex = new THREE.CanvasTexture(texCanvas);
  earthTex.flipY = true;
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.0,64,64),
    new THREE.MeshBasicMaterial({map:earthTex, transparent:true, opacity:0.85})
  );
  globe.add(earthMesh);

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(r=>r.json()).then(topo=>{
      const countries = topo.objects.countries, arcs = topo.arcs;
      function decodeArc(arcIdx){
        const reverse = arcIdx<0;
        const arc = arcs[reverse?~arcIdx:arcIdx];
        const coords=[]; let x=0,y=0;
        arc.forEach(([dx,dy])=>{x+=dx;y+=dy;coords.push([x,y])});
        const t=topo.transform;
        const decoded=coords.map(([px,py])=>[px*t.scale[0]+t.translate[0],py*t.scale[1]+t.translate[1]]);
        return reverse?decoded.reverse():decoded;
      }
      function ringToCoords(ring){
        let coords=[];
        ring.forEach(arcIdx=>{coords=coords.concat(decodeArc(arcIdx))});
        return coords;
      }
      function drawPolygon(rings){
        rings.forEach((ring,i)=>{
          const coords=ringToCoords(ring);
          if(coords.length<3)return;
          tc.beginPath();
          coords.forEach(([lng,lat],j)=>{
            const x=(lng+180)/360*texSize, y=(90-lat)/180*(texSize/2);
            j===0?tc.moveTo(x,y):tc.lineTo(x,y);
          });
          tc.closePath();
          if(i===0){tc.fillStyle='#ffffff';tc.fill();}
          tc.strokeStyle='#333333';tc.lineWidth=1.5;tc.stroke();
        });
      }
      countries.geometries.forEach(geo=>{
        if(geo.type==='Polygon')drawPolygon(geo.arcs);
        else if(geo.type==='MultiPolygon')geo.arcs.forEach(p=>drawPolygon(p));
      });
      earthTex.needsUpdate=true;
    });

  function latLngTo3D(lat,lng,r=1.01){
    const phi=(90-lat)*Math.PI/180, theta=(lng+180)*Math.PI/180;
    return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
  }

  const incidents=[
    {lat:37.4,lng:-122.1,title:"Uber self-driving fatality",year:2018,domain:"Safety"},
    {lat:40.7,lng:-74,title:"COMPAS recidivism bias",year:2016,domain:"Discrimination"},
    {lat:33.7,lng:-84.4,title:"Amazon hiring bias",year:2018,domain:"Discrimination"},
    {lat:51.5,lng:-0.1,title:"UK A-level grading",year:2020,domain:"Discrimination"},
    {lat:52.5,lng:13.4,title:"Clearview AI surveillance",year:2020,domain:"Privacy"},
    {lat:39.9,lng:116.4,title:"Deepfake manipulation",year:2023,domain:"Misinformation"},
    {lat:35.7,lng:139.7,title:"Line AI data leak",year:2023,domain:"Privacy"},
    {lat:37.6,lng:127,title:"Lee Luda hate speech",year:2021,domain:"Discrimination"},
    {lat:-33.9,lng:151.2,title:"Robodebt welfare fraud",year:2019,domain:"Safety"},
    {lat:28.6,lng:77.2,title:"Aadhaar biometric exclusion",year:2018,domain:"Discrimination"},
    {lat:48.9,lng:2.3,title:"France facial recognition",year:2019,domain:"Privacy"},
    {lat:41.9,lng:12.5,title:"Italy ChatGPT ban",year:2023,domain:"Privacy"},
    {lat:1.3,lng:103.8,title:"AI hiring discrimination",year:2022,domain:"Discrimination"},
    {lat:34.1,lng:-118.2,title:"AI-generated CSAM",year:2023,domain:"Malicious"},
    {lat:55.8,lng:37.6,title:"Military autonomous targeting",year:2023,domain:"Safety"},
    {lat:-23.5,lng:-46.6,title:"Wrongful arrest Brazil",year:2021,domain:"Discrimination"},
    {lat:42.4,lng:-71.1,title:"MIT dataset ethics",year:2020,domain:"Privacy"},
    {lat:47.6,lng:-122.3,title:"Bing Chat manipulation",year:2023,domain:"Misinformation"},
    {lat:38.9,lng:-77,title:"Pentagon AI drone sim",year:2023,domain:"Safety"},
    {lat:19,lng:72.8,title:"Deepfake elections India",year:2024,domain:"Misinformation"},
    {lat:50.8,lng:4.4,title:"EU AI Act enforcement",year:2024,domain:"Governance"},
    {lat:-37.8,lng:145,title:"AI medical misdiagnosis",year:2023,domain:"Safety"},
    {lat:31.2,lng:121.5,title:"AV pedestrian injury",year:2022,domain:"Safety"},
    {lat:43.7,lng:-79.4,title:"Content moderation failures",year:2023,domain:"Misinformation"},
  ];

  const dotGeo=new THREE.SphereGeometry(0.02,8,8);
  const glowGeo=new THREE.SphereGeometry(0.045,8,8);
  const glow2Geo=new THREE.SphereGeometry(0.07,8,8);
  const incidentMeshes=[];

  incidents.forEach((inc,i)=>{
    const pos=latLngTo3D(inc.lat,inc.lng,1.015);
    const dot=new THREE.Mesh(dotGeo,new THREE.MeshBasicMaterial({color:0xff4060,transparent:true,opacity:1}));
    dot.position.copy(pos); dot.userData={index:i}; globe.add(dot); incidentMeshes.push(dot);
    const glow=new THREE.Mesh(glowGeo,new THREE.MeshBasicMaterial({color:0xff4060,transparent:true,opacity:0.35}));
    glow.position.copy(pos); globe.add(glow);
    const glow2=new THREE.Mesh(glow2Geo,new THREE.MeshBasicMaterial({color:0xff4060,transparent:true,opacity:0.12}));
    glow2.position.copy(pos); globe.add(glow2);
  });

  function makeArc(lat1,lng1,lat2,lng2){
    const s=latLngTo3D(lat1,lng1,1.01),e=latLngTo3D(lat2,lng2,1.01);
    const m=s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(1.15);
    const pts=new THREE.QuadraticBezierCurve3(s,m,e).getPoints(32);
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0xA32035,transparent:true,opacity:0.08})));
  }
  makeArc(40.7,-74,51.5,-0.1); makeArc(51.5,-0.1,39.9,116.4);
  makeArc(37.8,-122.4,35.7,139.7); makeArc(50.8,4.4,38.9,-77);

  const tooltip=document.createElement('div');
  tooltip.style.cssText='position:fixed;padding:14px 16px;background:rgba(20,20,20,.95);backdrop-filter:blur(12px);color:#fff;font:13px/1.5 Figtree,system-ui,sans-serif;border-radius:12px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:100;max-width:300px;border:1px solid rgba(255,255,255,.08);box-shadow:0 8px 32px rgba(0,0,0,.4)';
  document.body.appendChild(tooltip);

  const raycaster=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  let isDragging=false,isHovering=false,prevX=0,prevY=0,rotVelX=0.0003,rotVelY=0;
  const BASE_SPIN=0.0003;

  canvas.addEventListener('pointerdown',e=>{isDragging=true;prevX=e.clientX;prevY=e.clientY;rotVelX=0;rotVelY=0});
  window.addEventListener('pointerup',()=>{isDragging=false;if(Math.abs(rotVelX)<BASE_SPIN)rotVelX=BASE_SPIN});
  window.addEventListener('pointermove',e=>{
    if(isDragging){const dx=e.clientX-prevX,dy=e.clientY-prevY;rotVelX=dx*0.003;rotVelY=dy*0.003;prevX=e.clientX;prevY=e.clientY}
    const rect=canvas.getBoundingClientRect();
    mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects(incidentMeshes);
    if(hits.length>0&&!isDragging){
      isHovering=true;
      const inc=incidents[hits[0].object.userData.index];
      tooltip.innerHTML='<div style="color:#e8576a;font-weight:700;font-size:13px;margin-bottom:4px">'+inc.title+'</div><div style="color:rgba(255,255,255,.4);font-size:10px">'+inc.year+' · '+inc.domain+'</div>';
      tooltip.style.opacity='1';
      tooltip.style.left=Math.min(e.clientX+16,window.innerWidth-340)+'px';
      tooltip.style.top=Math.max(e.clientY-10,10)+'px';
      canvas.style.cursor='pointer';
    }else{isHovering=false;tooltip.style.opacity='0';canvas.style.cursor=isDragging?'grabbing':'grab'}
  });

  function resize(){
    const w=canvas.clientWidth,h=canvas.clientHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
  }
  function animate(){
    requestAnimationFrame(animate);
    if(!isHovering){
      globe.rotation.y+=rotVelX;globe.rotation.x+=rotVelY;
      rotVelX*=0.98;rotVelY*=0.95;
      if(!isDragging&&Math.abs(rotVelX)<BASE_SPIN)rotVelX=BASE_SPIN;
    }
    resize();
    renderer.render(scene,camera);
  }
  resize();animate();
})();
