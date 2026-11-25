import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import 'dotenv/config';
const rl=createInterface({input:stdin,output:stdout});
const base=(process.env.PTERO_URL||'https://zarek.vexel.bond').replace(/\/$/,'');
const token=process.env.PTERO_APPLICATION_KEY;
const repo='https://github.com/BestGameClips/Bot-Discord-de-rappels-en-Node.js.git';
async function api(path,method='GET',body,client=false){
 const key=client?process.env.PTERO_CLIENT_KEY:token;
 const res=await fetch(base+'/api/'+(client?'client':'application')+path,{method,headers:{Authorization:'Bearer '+key,Accept:'application/json','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 const raw=await res.text();
 if(!res.ok)throw Error('HTTP '+res.status+' '+raw.slice(0,500));
 return raw?JSON.parse(raw):null;
}
async function list(path){let page=1,out=[];while(true){const r=await api(path+(path.includes('?')?'&':'?')+'page='+page);out.push(...(r.data||[]).map(x=>x.attributes));if(page>= (r.meta?.pagination?.total_pages||1))return out;page++;}}
async function pick(title,items,label){if(!items.length)throw Error('Aucun élément : '+title);console.log('\n'+title);items.forEach((x,i)=>console.log((i+1)+'. '+label(x)));const n=Number(await rl.question('Numéro : '));if(!Number.isInteger(n)||n<1||n>items.length)throw Error('Sélection invalide');return items[n-1];}
try{
 if(!token)throw Error('Définir PTERO_APPLICATION_KEY dans le fichier .env local. Ne jamais publier la clé.');
 if(!base.startsWith('https://'))throw Error('HTTPS obligatoire.');
 const owner=await pick('Propriétaire du serveur',await list('/users'),x=>x.username+' (#'+x.id+')');
 const node=await pick('Node',await list('/nodes'),x=>x.name+' (#'+x.id+')');
 const alloc=await pick('Allocation libre',(await list('/nodes/'+node.id+'/allocations')).filter(x=>!x.assigned),x=>x.ip+':'+x.port);
 const nests=await list('/nests');
 const eggs=[];
 for(const nest of nests){for(const egg of await list('/nests/'+nest.id+'/eggs'))eggs.push({...egg,nestId:nest.id});}
 const egg=await pick('Choisir un egg Node.js compatible Git',eggs,x=>x.name+' (#'+x.id+')');
 const details=(await api('/nests/'+egg.nestId+'/eggs/'+egg.id+'?include=variables')).attributes;
 const images=Object.entries(details.docker_images||{}).map(([name,image])=>({name,image}));
 const image=await pick('Image Node.js (22.13+ ou 24)',images,x=>x.name+' — '+x.image);
 const vars=details.relationships?.variables?.data?.map(x=>x.attributes)||[];
 const env={};
 for(const v of vars){
 const k=v.env_variable;
 const known={GIT_ADDRESS:repo,GIT_REPO:repo,BRANCH:'main',GIT_BRANCH:'main',JS_FILE:'index.js',MAIN_FILE:'index.js',AUTO_UPDATE:'0',USER_UPLOAD:'0',NODE_ARGS:'--max-old-space-size=256'};
 const def=known[k]??v.default_value??'';
 env[k]=(await rl.question(k+' ['+def+'] : '))||def;
 }
 const startup=(await rl.question('Commande de démarrage ['+details.startup+'] : '))||details.startup;
 console.log('Serveur ReminderBot, RAM 512 MiB, swap 0, CPU 50 %, disque 1024 MiB, node '+node.name+', allocation '+alloc.port);
 if((await rl.question('Créer le serveur ? (oui/non) : ')).trim().toLowerCase()!=='oui')throw Error('Annulé');
 const r=await api('/servers','POST',{name:'ReminderBot',user:owner.id,egg:egg.id,docker_image:image.image,startup,environment:env,limits:{memory:512,swap:0,disk:1024,io:500,cpu:50},feature_limits:{databases:0,allocations:1,backups:3},allocation:{default:alloc.id},start_on_completion:false});
 const server=r.attributes;
 console.log('Serveur créé : '+base+'/server/'+server.identifier);
 console.log('ID : '+server.id+' — installation de l’egg lancée. Ne pas relancer le script pour ce serveur.');
 if(process.env.PTERO_CLIENT_KEY){
 const ok=await rl.question('Après avoir vérifié que l’installation est terminée dans le panel, saisir oui pour créer .env (uniquement si absent) : ');
 if(ok.trim().toLowerCase()==='oui'){
 const files=await api('/servers/'+server.identifier+'/files/list?directory=%2F','GET',undefined,true);
 if(files.data?.some(x=>x.attributes.name==='.env'))console.log('.env existe déjà : conservé.');
 else {
 const res=await fetch(base+'/api/client/servers/'+server.identifier+'/files/write?file=%2F.env',{method:'POST',headers:{Authorization:'Bearer '+process.env.PTERO_CLIENT_KEY,Accept:'application/json','Content-Type':'text/plain'},body:'DISCORD_TOKEN=\nCLIENT_ID=\nOWNER_ID=\nTIMEZONE=Europe/Paris\n',signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('Écriture .env : HTTP '+res.status);
 console.log('.env créé. Compléter les identifiants dans le panel avant démarrage.');
 }
 }
 }
 console.log('Vérifier les fichiers GitHub et les dépendances npm dans le panel. Le serveur reste arrêté jusqu’à configuration.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{rl.close();}
