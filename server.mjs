import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT || 4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const url=new URL(req.url,'http://localhost');
    const requested=decodeURIComponent(url.pathname);
    const target=path.resolve(root,'.'+(requested==='/'?'/index.html':requested));
    const relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
    if(!(await stat(target)).isFile())throw new Error('Not a file');
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`MathWithCYE ready at http://127.0.0.1:${port}`));
